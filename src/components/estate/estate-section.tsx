import type { HomePageContent } from "@/lib/content/types";
import { EstateExplorer } from "./estate-explorer";
import styles from "./estate.module.css";

export function EstateSection({ page }: { page: HomePageContent }) {
  return (
    <section aria-labelledby="estate-title" className={styles.section} id="explore-estate">
      <div className="container">
        <header className={styles.heading}>
          <div>
            <span className="eyebrow">{page.estate.eyebrow}</span>
            <h2 className="section-title" id="estate-title">{page.estate.title}</h2>
          </div>
          <p>{page.estate.lead}</p>
        </header>
        <EstateExplorer copy={page.estate} />
        <div className={styles.caption}>
          <strong>{page.estate.study}</strong>
          <p>{page.estate.disclaimer}</p>
        </div>
        <p className={styles.credits}>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>
          {" · "}<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Mapzen · Copernicus EU-DEM</a>
          {" · "}<a href="/models/positano-osm.json" download>Open data</a>
          {" · "}<a href="/models/positano-roads-osm.json" download>SS163 · Open data</a>
          <br />Produced using Copernicus data and information funded by the European Union — EU-DEM layers.
        </p>
        <aside className={styles.stepsNotice}>
          <strong>{page.stepsNotice.title}</strong>
          <p>{page.stepsNotice.text}</p>
        </aside>
      </div>
    </section>
  );
}
