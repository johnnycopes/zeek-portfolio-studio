import { defineField, defineType, defineArrayMember } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Image",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
        }),
      ],
      options: {
        list: [
          { title: "Branding", value: "branding" },
          { title: "Illustration", value: "illustration" },
          { title: "Packaging", value: "packaging" },
          { title: "Lettering", value: "lettering" },
          { title: "Merch", value: "merch" },
        ],
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    orderRankField({ type: "galleryImage" }),
  ],
  preview: {
    select: {
      title: "title",
      client: "client",
      media: "image",
    },
    prepare({ title, client, media }) {
      return {
        title,
        subtitle: client ?? "",
        media,
      };
    },
  },
  orderings: [orderRankOrdering],
});
