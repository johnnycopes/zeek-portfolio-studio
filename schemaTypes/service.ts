import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "number",
      title: "Number",
      type: "number",
      description: "Display order (01–06). Shown on the service card.",
      validation: (Rule) => Rule.required().min(1).max(6),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      number: "number",
    },
    prepare({ title, number }) {
      const padded = number != null ? String(number).padStart(2, "0") : "—";
      return {
        title,
        subtitle: padded,
      };
    },
  },
  orderings: [
    {
      title: "Number",
      name: "numberAsc",
      by: [{ field: "number", direction: "asc" }],
    },
  ],
});
