import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { extractErrorMessage, resolveAssetUrl} from "../store/api/client";
import { useDeleteProductImageMutation, useGetProductImagesQuery, useUploadProductImagesMutation } from '../store/api/adminApi';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

type ProductImagesManagerProps = {
    productId: string;
};

export function ProductImagesManager({ productId }: ProductImagesManagerProps) {
    const dispatch = useAppDispatch();
    const { data: images = [] } = useGetProductImagesQuery(productId);
    const [uploadImages, { isLoading: isUploading }] = useUploadProductImagesMutation();
    const [deleteImage] = useDeleteProductImageMutation();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    async function handleFilesSelected(fileList: FileList | null) {
        if (!fileList || fileList.length === 0) return;

        try {
            await uploadImages({ productId, files: Array.from(fileList) }).unwrap();
            dispatch(messageSet(`Додано фото: ${fileList.length}.`));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося завантажити фото.')));
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleDelete(imageId: string) {
        try {
            await deleteImage({ productId, imageId }).unwrap();
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося видалити фото.')));
        }
    }

    return (
        <div className="product-images-manager">
            {images.map((image) => (
                <div className="product-images-thumb" key={image.id}>
                    <img src={resolveAssetUrl(image.thumbnailUrl)} alt="Фото товару" />
                    <button
                        type="button"
                        className="product-images-remove"
                        onClick={() => handleDelete(image.id)}
                        aria-label="Видалити фото"
                    >
                        <X size={13} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                className="product-images-add"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Додати фото"
            >
                <Plus size={18} />
                <span>{isUploading ? '...' : 'Фото'}</span>
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="product-images-file-input"
                onChange={(event) => handleFilesSelected(event.currentTarget.files)}
            />
        </div>
    );
}