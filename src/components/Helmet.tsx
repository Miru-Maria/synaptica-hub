import { useEffect } from "react";

interface HelmetProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

export function Helmet({ title, description, ogTitle, ogDescription, ogImage, ogType }: HelmetProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null;
      }
      if (!el) {
        el = document.createElement("meta");
        if (property.startsWith("og:")) {
          el.setAttribute("property", property);
        } else {
          el.setAttribute("name", property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) setMeta("description", description);
    if (ogTitle) setMeta("og:title", ogTitle);
    if (ogDescription) setMeta("og:description", ogDescription);
    if (ogImage) setMeta("og:image", ogImage);
    if (ogType) setMeta("og:type", ogType);

    return () => {
      document.title = "Synaptica Knowledge Systems";
    };
  }, [title, description, ogTitle, ogDescription, ogImage, ogType]);

  return null;
}
