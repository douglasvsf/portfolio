import "server-only";
import QRCode from "qrcode";

/** QR Code do Pix em SVG, gerado no servidor (nada de biblioteca de QR no navegador). */
export function pixQrSvg(brCode: string) {
  return QRCode.toString(brCode, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0a0a0aff", light: "#ffffffff" } });
}
