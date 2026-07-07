import f00 from "@/assets/images/iphone-14-3d-frame.jpg";
import f22 from "@/assets/images/phone-rotation/f22.jpg";
import f26 from "@/assets/images/phone-rotation/f26.jpg";
import f30 from "@/assets/images/phone-rotation/f30.jpg";
import f34 from "@/assets/images/phone-rotation/f34.jpg";
import f38 from "@/assets/images/phone-rotation/f38.jpg";
import f42 from "@/assets/images/phone-rotation/f42.jpg";
import f45 from "@/assets/images/phone-rotation/f45.jpg";

// A short run lifted straight out of the source SVG's own 71-frame turntable
// render (frontal -> ~55° over frames 0-45), used to swap the phone's
// background image as it flies between features. A real perspective-rendered
// turn reads far more convincingly than faking rotation with a flat CSS
// rotateY() on a single frontal image.
export const ROTATION_FRAMES = [f00, f22, f26, f30, f34, f38, f42, f45].map((img) => img.src);

export const ROTATION_FRAME_COUNT = ROTATION_FRAMES.length;
