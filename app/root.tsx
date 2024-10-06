import {
  Form,
  Links,
  Meta,
  useActionData,
  json,
  Scripts,
  ScrollRestoration,
  useSubmit,
} from "@remix-run/react";
import { useState, useRef } from "react";
import { 
  ActionFunction, 
  unstable_parseMultipartFormData,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
} from "@remix-run/node";
// import multer from "multer";
import { Cropper, CropperRef } from "react-mobile-cropper";
import "react-mobile-cropper/dist/style.css";

export const action: ActionFunction = async ({ request }) => {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      // Limit file upload to images
      filter({ contentType }) {
        return contentType.includes("image");
      },
      directory: "uploads/",
      // Limit the max size to 10MB
      maxPartSize: 10 * 1024 * 1024,
    }),
  )

  const formData  = await unstable_parseMultipartFormData(request, uploadHandler);

  const img = formData.get("image");
  const croppedImg = formData.get("croppedImage");

  console.log(img);
  console.log(croppedImg);

  if (!img) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  return json({ success: true });
};


export default function App() {
  const actionData = useActionData();
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<CropperRef>(null);
  const submit = useSubmit();

  const handleImageChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const submitForm = () => {
    console.log("submitting form");
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCroppedCanvas();
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("croppedImage", file);
            console.log("submitting form");
            submit(formData);
          }
        });
      }
    }
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas();
      if (canvas) {
        setCroppedImage(canvas.toDataURL());
      }
    }
  }

  const clearImage = () => {
    setImage(null);
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Upload an image</h1>
        <button type="button" onClick={clearImage}>Clear</button>
        <Form method="post" encType="multipart/form-data">
          <input type="file" name="image" onChange={handleImageChange}/>
          <input type="hidden" name="croppedImage" value={croppedImage || ""} />
          <button type="submit">Upload</button>
        </Form>
        {image && (
        <div style={{ marginTop: "20px" }}>
          <Cropper
            ref={cropperRef}
            src={image}
            stencilProps={{
              aspectRatio: 1,
            }}
            onChange={handleCrop}
          />
        </div>
        )}
        {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
        {actionData?.success && <p>File uploaded successfully!</p>}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
