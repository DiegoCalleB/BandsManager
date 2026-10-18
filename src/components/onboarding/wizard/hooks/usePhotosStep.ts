import { epkDe } from "../epkLegacy";
/**
 * Paso de fotos: subida y galería.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { EPKConfig } from "../../../../types";
import { uploadFileToServer } from "../../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PhotosStepParams {
  epkConfig: EPKConfig;
  activeBandId: string;
}

/**
 * Paso de fotos: subida y galería.
 * @param params Estado y callbacks del contenedor ({@link PhotosStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePhotosStep({ epkConfig, activeBandId }: PhotosStepParams) {
  // --- Step 12: Fotos EPK ---
  const [photos, setPhotos] = useState<string[]>(
    epkConfig?.bandPhotos || epkDe(epkConfig)?.fotos || [],
  );

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Photos Add/Remove
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadFileToServer(file, {
          bandId: activeBandId,
          category: "photo",
        });
        if (url) {
          setPhotos((prev) => [...prev, url]);
        }
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotos((prev) => [...prev, newPhotoUrl.trim()]);
    setNewPhotoUrl("");
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  return { setPhotos, photos, isUploadingPhoto, handlePhotoUpload, handleRemovePhoto, newPhotoUrl, setNewPhotoUrl, handleAddPhotoUrl };
}
