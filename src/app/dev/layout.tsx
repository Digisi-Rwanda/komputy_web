import { notFound } from "next/navigation";

// Internal asset gallery: available in local development only, never on komputy.com.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
