import { defineField, defineType, defineArrayMember } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "headshot",
      title: "Headshot",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Blockquote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "clients",
      title: "Clients",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      media: "headshot",
    },
    prepare({ media }) {
      return {
        title: "About",
        media,
      };
    },
  },
});
