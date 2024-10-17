import {
  useActionData,
  json,
  useSubmit,
} from "@remix-run/react";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  ActionFunction,
  unstable_parseMultipartFormData,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
} from "@remix-run/node";
import { Cropper, CropperRef } from "react-mobile-cropper";
import "react-mobile-cropper/dist/style.css";
import { Button } from "~/components/ui/button"
import { ChevronLeft, Upload } from "lucide-react";
import { dateToCompactString } from "~/lib/utils";


export const action: ActionFunction = async ({ request }) => {
  // const {searchParams} = new URL(request.url);
  // const location = searchParams.get("loc");

  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      // Limit file upload to images
      filter({ contentType }) {
        return contentType.includes("image");
      },
      file: (file) => {
        const currentDate = dateToCompactString(new Date());
        return  [currentDate, file.filename].join("_");
      },
      directory: "uploads/",
      // Limit the max size to 10MB
      maxPartSize: 20 * 1024 * 1024,
    }),
  )

  try {
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);

    const croppedImg = formData.get("croppedImage");

    if (!croppedImg) {
      return json({ error: "No file uploaded" }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ error: "Image too large, cannot exceed 10MB" }, { status: 400 });
  }

  return json({ success: "File uploaded" }, { status: 200 });
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
    const canvas = cropperRef.current?.getCanvas({
      maxWidth: 300,
      maxHeight: 300,
    });
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
          setImage(null);
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
        <div className="flex items-center justify-between mx-auto p-2">
          <Button variant="ghost" disabled={!image} onClick={closeCropper}>
            <ChevronLeft className="mr-2 h-4 w-4" />Back
          </Button>
          <img src="/logo1.png" alt="" width="40" height="40" />
          <Button variant="ghost" disabled={!image} onClick={handleSubmit}>
            Upload<Upload className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>
      {image && (
        <div className="main-wrapper">
          <Cropper
            className="cropper"
            src={image && image.src}
            ref={cropperRef}
            defaultSize={() => ({width: 300, height: 300})}
            stencilProps={{
              aspectRatio: 1,
            }} />
        </div>
      )}
      {!image && (
        <div className="welcome">
          {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
          {actionData?.success && <p style={{ color: "green" }}>{actionData.success}</p>}
          <span className="p-5">Upload or Take a picture to share with us!</span>
          <Button className="upload-button" onClick={onUpload}>
            <input ref={inputRef} type="file" name="image" accept="image/*" onChange={onLoadImage} />
            Upload image
          </Button>
        </div>
      )}

    </div>
  );
}
