import CommonCrypto
import Foundation
import Security

// Local demo credentials only; real authentication must live on a trusted server.
enum Password {
    private static let rounds: UInt32 = 120_000

    static func normalize(_ code: String) -> String {
        code.trimmingCharacters(in: .whitespacesAndNewlines)
            .uppercased(with: Locale(identifier: "it_IT"))
            .replacingOccurrences(of: #"\s+"#, with: "-", options: .regularExpression)
    }

    static func hash(_ password: String) throws -> String {
        guard !password.isEmpty, password.utf8.count <= 256 else { throw PortalError.invalidInput }
        let salt = try randomBytes(16)
        return "pbkdf2-sha256:\(rounds):\(hex(salt)):\(hex(try derive(password, salt: salt)))"
    }

    static func wellFormed(_ stored: String) -> Bool {
        let parts = stored.split(separator: ":", omittingEmptySubsequences: false)
        return parts.count == 4 && parts[0] == "pbkdf2-sha256" && UInt32(parts[1]) == rounds
            && bytes(String(parts[2]))?.count == 16 && bytes(String(parts[3]))?.count == 32
    }

    static func verify(_ password: String, hash: String) -> Bool {
        guard password.utf8.count <= 256, wellFormed(hash) else { return false }
        let parts = hash.split(separator: ":")
        guard let salt = bytes(String(parts[2])), let expected = bytes(String(parts[3])),
              let actual = try? derive(password, salt: salt) else { return false }
        return zip(actual, expected).reduce(UInt8(0)) { $0 | ($1.0 ^ $1.1) } == 0
    }

    static func generate() throws -> String {
        // Hex avoids modulo bias and ambiguous punctuation; 96 random bits.
        let value = hex(try randomBytes(12))
        return stride(from: 0, to: value.count, by: 6).map { offset in
            String(value.dropFirst(offset).prefix(6))
        }.joined(separator: "-")
    }

    private static func randomBytes(_ count: Int) throws -> [UInt8] {
        var result = [UInt8](repeating: 0, count: count)
        guard SecRandomCopyBytes(kSecRandomDefault, count, &result) == errSecSuccess else {
            throw PortalError.persistence
        }
        return result
    }

    private static func derive(_ password: String, salt: [UInt8]) throws -> [UInt8] {
        var output = [UInt8](repeating: 0, count: 32)
        let status = password.withCString { pointer in
            CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), pointer, password.utf8.count,
                                salt, salt.count, CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                                rounds, &output, 32)
        }
        guard status == kCCSuccess else { throw PortalError.persistence }
        return output
    }

    private static func hex(_ bytes: [UInt8]) -> String {
        bytes.map { String(format: "%02x", $0) }.joined()
    }

    private static func bytes(_ hex: String) -> [UInt8]? {
        guard hex.count.isMultiple(of: 2), hex.range(of: #"^[a-fA-F0-9]+$"#, options: .regularExpression) != nil else { return nil }
        let chars = Array(hex)
        return stride(from: 0, to: chars.count, by: 2).compactMap { UInt8(String(chars[$0...$0 + 1]), radix: 16) }
    }
}
