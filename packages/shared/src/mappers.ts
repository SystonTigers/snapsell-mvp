export function toEbayTitle(i: {brand?:string;model?:string;size?:string;color?:string;condition?:string}) {
  return [i.brand, i.model, i.size, i.color, i.condition].filter(Boolean).join(" ");
}
