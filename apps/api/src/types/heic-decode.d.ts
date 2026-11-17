// heic-decode n'est pas fourni avec ses types : on décrit la seule fonction utilisée.
declare module 'heic-decode' {
  type ImageDecodee = { width: number; height: number; data: Uint8ClampedArray };
  export default function decode(options: { buffer: Uint8Array }): Promise<ImageDecodee>;
}
