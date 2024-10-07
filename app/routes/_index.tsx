import {
  Form,
  useActionData,
  json,
  Scripts,
  ScrollRestoration,
  useSubmit,
  redirect,
} from "@remix-run/react";
import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  ActionFunction,
  unstable_parseMultipartFormData,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
} from "@remix-run/node";
import { Cropper, CropperRef, CircleStencil } from "react-mobile-cropper";
import "react-mobile-cropper/dist/style.css";
import { Button } from "~/components/ui/button"


export const action: ActionFunction = async ({ request }) => {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      // Limit file upload to images
      filter({ contentType }) {
        return contentType.includes("image");
      },
      file: (file) => {
        return file.filename;
      },
      directory: "uploads/",
      // Limit the max size to 10MB
      maxPartSize: 10 * 1024 * 1024,
    }),
  )

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  const croppedImg = formData.get("croppedImage");

  console.log(croppedImg);

  if (!croppedImg) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  return redirect("/success");
};

interface Image {
  src: string;
  name: string;
}

function roundEdges(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  if (context) {
    context.fillStyle = "#fff";
    context.globalCompositeOperation = "destination-in";
    context.beginPath();
    context.scale(1, height / width);
    context.arc(width / 2, width / 2, width / 2, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }
  return canvas;
}


export default function Index() {
  const actionData = useActionData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<Image | null>(null);

  const cropperRef = useRef<CropperRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(event.currentTarget);
    const formData = new FormData(event.currentTarget);
    const canvas = cropperRef.current?.getCanvas();
    console.log(formData);
    if (canvas) {
      const roundCanvas = roundEdges(canvas);
      roundCanvas.toBlob((blob) => {
        if (blob) {
          console.log(blob);
          const file = new File([blob], image?.name || "cropped.png", { type: "image/png" });
          formData.set("croppedImage", file);
          submit(formData, {
            method: "post",
            encType: "multipart/form-data",
          });
        }
      }, 'image/png');
    }
  };

  const onUpload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  const onLoadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files[0]) {
      const blob = URL.createObjectURL(files[0]);
      const filename = files[0].name;
      const reader = new FileReader();
      reader.onload = () => {
        setImage({
          name: filename,
          src: blob,
        });
      }
      reader.readAsArrayBuffer(files[0]);
    }
    event.target.value = '';
  }

  return (
      <div>
        {image && (
          <div className="upload-wrapper">
            {image && (
              <Cropper 
                className="upload__cropper" 
                src={image && image.src} 
                ref={cropperRef} 
                stencilComponent={CircleStencil} 
                stencilProps={{
                  resizeable: false,
                  movable: false,
                }} />
            )}
          </div>
        )}

        <Form ref={formRef} method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
          <input type="hidden" name="image" />
          <input type="hidden" name="croppedImage" />
          <Button className="button" onClick={onUpload}>
            <input ref={inputRef} type="file" accept="image/*" onChange={onLoadImage} />
            Upload image
          </Button>
          <Button disabled={!image} type="submit">Submit</Button>
        </Form>
        {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
        <ScrollRestoration />
        <Scripts />
      </div>
  );
}
