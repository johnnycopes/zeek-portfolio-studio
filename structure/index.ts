import { StructureBuilder } from "sanity/structure";

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Work")
        .child(S.documentTypeList("galleryImage").title("Gallery Images")),
      S.divider(),
      S.listItem()
        .title("Services")
        .child(S.documentTypeList("service").title("Services")),
      S.listItem()
        .title("About Page")
        .child(
          S.document().schemaType("aboutPage").documentId("aboutPage")
        ),
      S.divider(),
      S.listItem()
        .title("Site Settings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
    ]);
