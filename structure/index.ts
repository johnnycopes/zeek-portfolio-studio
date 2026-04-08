import { StructureBuilder, StructureResolverContext } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";

export const structure = (S: StructureBuilder, context: StructureResolverContext) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Work")
        .child(
          S.list()
            .title("Gallery Images")
            .items([
              orderableDocumentListDeskItem({ type: "galleryImage", title: "Sort Order", S, context }),
              S.divider(),
              S.listItem()
                .title("Alphabetical")
                .child(
                  S.documentList()
                    .title("Alphabetical")
                    .schemaType("galleryImage")
                    .filter('_type == "galleryImage"')
                    .defaultOrdering([{ field: "title", direction: "asc" }])
                ),
            ])
        ),
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
