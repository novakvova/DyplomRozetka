import {useRef, useState} from 'react';
import {
    ImageIcon,
    Plus,
    X,
} from 'lucide-react';

import {
    extractErrorMessage,
    resolveAssetUrl,
} from '../store/api/client';

import {
    useDeleteProductImageMutation,
    useGetProductImagesQuery,
    useUploadProductImagesMutation,
} from '../store/api/adminApi';

import {useAppDispatch} from '../store/hooks';
import {messageSet} from '../store/uiSlice';

type ProductImagesManagerProps = {
    productId: string;
};

export function ProductImagesManager({
                                         productId,
                                     }: ProductImagesManagerProps) {
    const dispatch = useAppDispatch();

    const {
        data: images = [],
        isLoading,
    } = useGetProductImagesQuery(productId);

    const [
        uploadImages,
        {isLoading: isUploading},
    ] = useUploadProductImagesMutation();

    const [
        deleteImage,
        {isLoading: isDeleting},
    ] = useDeleteProductImageMutation();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    async function handleFilesSelected(
        fileList: FileList | null,
    ) {
        if (
            !fileList ||
            fileList.length === 0
        ) {
            return;
        }

        try {
            await uploadImages({
                productId,
                files: Array.from(fileList),
            }).unwrap();

            dispatch(
                messageSet(
                    `Додано фото: ${fileList.length}.`,
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося завантажити фото.',
                    ),
                ),
            );
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    async function handleDelete(
        imageId: string,
    ) {
        try {
            await deleteImage({
                productId,
                imageId,
            }).unwrap();

            dispatch(
                messageSet('Фото видалено.'),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося видалити фото.',
                    ),
                ),
            );
        }
    }

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="m-0 text-sm font-medium text-gray-700">
                        Фотографії товару
                    </p>

                    <p className="mb-0 mt-1 text-xs text-gray-400">
                        {images.length > 0
                            ? `Завантажено: ${images.length}`
                            : 'Фото ще не додано'}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {isLoading ? (
                    <div
                        className="flex h-[76px] w-[76px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        <span className="text-xs text-gray-400">
                            ...
                        </span>
                    </div>
                ) : (
                    images.map((image) => (
                        <ProductImagePreview
                            key={image.id}
                            src={resolveAssetUrl(
                                image.thumbnailUrl,
                            )}
                            onDelete={() =>
                                handleDelete(image.id)
                            }
                            disabled={isDeleting}
                        />
                    ))
                )}

                <button
                    type="button"
                    onClick={() =>
                        fileInputRef.current?.click()
                    }
                    disabled={isUploading}
                    className="
                        flex h-[76px] w-[76px]
                        shrink-0 flex-col
                        items-center justify-center
                        gap-1
                        rounded-xl
                        border border-dashed border-gray-300
                        bg-white
                        text-gray-500
                        transition
                        hover:border-orange-300
                        hover:bg-orange-50
                        hover:text-orange-600
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                    aria-label="Додати фото"
                >
                    <Plus size={20}/>

                    <span className="text-xs font-medium">
                        {isUploading
                            ? '...'
                            : 'Фото'}
                    </span>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) =>
                        handleFilesSelected(
                            event.currentTarget.files,
                        )
                    }
                />
            </div>
        </div>
    );
}

type ProductImagePreviewProps = {
    src: string;
    onDelete: () => void;
    disabled: boolean;
};

function ProductImagePreview({
                                 src,
                                 onDelete,
                                 disabled,
                             }: ProductImagePreviewProps) {
    const [hasError, setHasError] =
        useState(false);

    return (
        <div className="group relative h-[76px] w-[76px] shrink-0">
            <div className="h-full w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {hasError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400">
                        <ImageIcon size={22}/>

                        <span className="text-[10px]">
                            Немає фото
                        </span>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt="Фото товару"
                        className="h-full w-full object-cover"
                        onError={() =>
                            setHasError(true)
                        }
                    />
                )}
            </div>

            <button
                type="button"
                onClick={onDelete}
                disabled={disabled}
                className="
        absolute right-1 top-1 z-10
        flex h-6 w-6
        items-center justify-center
        rounded-full
        bg-red-500
        text-white
        shadow-md
        transition
        hover:bg-red-600
        disabled:cursor-not-allowed
        disabled:opacity-50
    "
                aria-label="Видалити фото"
            >
                <X
                    size={14}
                    strokeWidth={3}
                    className="shrink-0"
                />
            </button>
        </div>
    );
}