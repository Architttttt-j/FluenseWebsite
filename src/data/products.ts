export const companyInfo = {
  name: "Fluense Pharma",
  tagline: "Serving healthcare partners in Pune, Goa, Karnataka and Konkan.",
  industry: "Pharmaceuticals & Healthcare",
  address: "[Full Company Address]",
  headOffice: "[Full Address]",
  email: "[Company Email]",
  phone: "[Phone Number]",
  website: "[Website URL]",
  established: "[Year]",
  shortDescription:
    "Fluense Pharma supplies pharmaceutical products and works with healthcare professionals, medical representatives and distribution partners.",
  aboutParagraph:
    "The company focuses on product quality and professional service for its healthcare and distribution partners.",
};

export const isPlaceholderValue = (value: string) =>
  value.trim().startsWith("[") && value.trim().endsWith("]");

export const navigation = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Our Presence", href: "#presence" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contact", href: "#contact" },
];
