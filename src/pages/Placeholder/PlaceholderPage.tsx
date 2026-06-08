import { sectionLabel } from "../../router/routes";
import type { Section } from "../../store";

type PlaceholderPageProps = {
  section: Section;
};

export function PlaceholderPage({ section }: PlaceholderPageProps) {
  return (
    <section className="single-page-layout">
      <div className="panel placeholder-panel">
        <p className="eyebrow">Workspace</p>
        <h2>{sectionLabel(section)}</h2>
        <p>该页面的数据视图待接入。</p>
      </div>
    </section>
  );
}
