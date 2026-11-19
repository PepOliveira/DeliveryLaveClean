/* eslint-disable @next/next/no-img-element */
export function Logo({ tamanho = 48 }: { tamanho?: number }) {
  return <img src="/logo.png" alt="LaveClean" width={tamanho} height={tamanho} style={{ display: "block", borderRadius: "50%" }} />;
}
