#!/bin/sh
set -eu

fenice_preflight="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/ci_post_clone.sh"

run_case() {
    fenice_case=$1
    fenice_expected_exit=$2
    fenice_expected_downloads=$3
    set +e
    (
        set -eu
        fenice_downloads=0
        fenice_installed=0
        xcrun() {
            [ "$*" = '--sdk iphoneos metal --version' ] || return 90
            [ "$fenice_case" = available ] || [ "$fenice_installed" -eq 1 ]
        }
        xcodebuild() {
            [ "$*" = '-downloadComponent MetalToolchain' ] || return 91
            fenice_downloads=$((fenice_downloads + 1))
            case "$fenice_case" in
                installs) fenice_installed=1 ;;
                installer_fails) return 42 ;;
                compiler_still_missing) return 0 ;;
                *) return 92 ;;
            esac
        }
        . "$fenice_preflight"
        [ "$fenice_downloads" -eq "$fenice_expected_downloads" ] || exit 93
    )
    fenice_actual_exit=$?
    set -e
    [ "$fenice_actual_exit" -eq "$fenice_expected_exit" ] || {
        printf 'FAIL %s: expected exit %s, got %s\n' "$fenice_case" "$fenice_expected_exit" "$fenice_actual_exit"
        exit 1
    }
    printf 'PASS %s\n' "$fenice_case"
}

run_case available 0 0
run_case installs 0 1
run_case installer_fails 42 1
run_case compiler_still_missing 1 1
