import {
  useActionData,
  json,
  useSubmit,
  redirect,
} from "@remix-run/react";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  ActionFunction,
  unstable_parseMultipartFormData,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
} from "@remix-run/node";
import { Cropper, CropperRef, CircleStencil } from "react-mobile-cropper";
import "react-mobile-cropper/dist/style.css";
import { Button } from "~/components/ui/button"
import { roundEdges } from "~/lib/canvas";


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

export default function Index() {
  const actionData = useActionData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<Image | null>(null);

  const cropperRef = useRef<CropperRef>(null);
  const submit = useSubmit();

  const handleSubmit = () => {
    const formData = new FormData();
    const canvas = cropperRef.current?.getCanvas();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = (image?.name.split('.').slice(0, -1) || "cropped") + ".png";
          const file = new File([blob], filename, { type: "image/png" });
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

  const closeCropper = () => {
    setImage(null);
  }

  useEffect(() => {
    // Revoke the object URL, to allow the garbage collector to destroy the uploaded before file
    return () => {
        if (image && image.src) {
            URL.revokeObjectURL(image.src);
        }
    };
}, [image]);

  return (
    <div className="container">
      <nav className="bg-white shadow-md z-50 sticky">
        <div className="flex items-center justify-between mx-auto p-3">
          <button disabled={!image} onClick={closeCropper}>Back</button>
          <img src="/logo1.png" alt="" width="40" height="40" />
          <button disabled={!image} onClick={handleSubmit}>
            Upload
          </button>
        </div>
      </nav>
      {image && (
        <div className="main-wrapper">
          <Cropper
            className="cropper"
            src={image && image.src}
            ref={cropperRef}
            stencilProps={{
              aspectRatio: 1,
            }} />
        </div>
      )}
      {!image && (
        <div className="welcome">
          <span>Upload an image to get started</span>
          <Button className="upload-button" onClick={onUpload}>
            <input ref={inputRef} type="file" name="image" accept="image/*" onChange={onLoadImage} />
            Upload image
          </Button>
        </div>
      )}

      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
    </div>
  );
}
