import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

interface Sticker {
    id: number;
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

const PhotoStripEditor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const webcamRef = useRef<Webcam>(null);
    const [photos, setPhotos] = useState<HTMLImageElement[]>([]);
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [availableStickers, setAvailableStickers] = useState<
        HTMLImageElement[]
    >([]);
    const [selectedSticker, setSelectedSticker] = useState<number | null>(null);
    const [dragging, setDragging] = useState<'move' | 'resize' | 'rotate' | null>(
        null
    );
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [resizeHandle, setResizeHandle] = useState<number | null>(null);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    const [backgroundImage, setBackgroundImage] =
        useState<HTMLImageElement | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
    const [foregroundImage, setForegroundImage] =
        useState<HTMLImageElement | null>(null);

    const CANVAS_WIDTH = 400;
    const PHOTO_HEIGHT = 300;
    const PADDING_TOP = 20;
    const PADDING_LEFT = 20;
    const PADDING_BOTTOM = 20;
    const PADDING_RIGHT = 20;
    const GAP = 10;
    const HANDLE_SIZE = 10;
    const PHOTO_DISPLAY_WIDTH = CANVAS_WIDTH - PADDING_LEFT - PADDING_RIGHT;

    useEffect(() => {
        redrawCanvas();
    }, [
        photos,
        stickers,
        selectedSticker,
        backgroundImage,
        backgroundColor,
        foregroundImage,
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
            if (e.key === 'Delete' && selectedSticker !== null) {
                setStickers((prev) => prev.filter((s) => s.id !== selectedSticker));
                setSelectedSticker(null);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedSticker]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height =
            PADDING_TOP +
            PADDING_BOTTOM +
            photos.length * PHOTO_HEIGHT +
            (photos.length > 1 ? (photos.length - 1) * GAP : 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Vẽ background
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Vẽ ảnh trong photostrip
        photos.forEach((photo, index) => {
            const yPosition = PADDING_TOP + index * (PHOTO_HEIGHT + GAP);
            ctx.drawImage(
                photo,
                PADDING_LEFT,
                yPosition,
                PHOTO_DISPLAY_WIDTH,
                PHOTO_HEIGHT
            );
        });

        // Vẽ foreground
        if (foregroundImage) {
            ctx.drawImage(foregroundImage, 0, 0, canvas.width, canvas.height);
        }

        // Vẽ stickers (sau foreground để nằm trên cùng)
        stickers.forEach((sticker) => {
            ctx.save();
            ctx.translate(sticker.x, sticker.y);
            ctx.rotate((sticker.rotation * Math.PI) / 180);
            ctx.drawImage(
                sticker.image,
                -sticker.width / 2,
                -sticker.height / 2,
                sticker.width,
                sticker.height
            );
            ctx.restore();

            if (selectedSticker === sticker.id) {
                ctx.save();
                ctx.translate(sticker.x, sticker.y);
                ctx.rotate((sticker.rotation * Math.PI) / 180);

                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    -sticker.width / 2,
                    -sticker.height / 2,
                    sticker.width,
                    sticker.height
                );

                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'blue';
                const handles = [
                    [-sticker.width / 2, -sticker.height / 2],
                    [sticker.width / 2, -sticker.height / 2],
                    [sticker.width / 2, sticker.height / 2],
                    [-sticker.width / 2, sticker.height / 2],
                ];
                handles.forEach(([x, y]) => {
                    ctx.fillRect(
                        x - HANDLE_SIZE / 2,
                        y - HANDLE_SIZE / 2,
                        HANDLE_SIZE,
                        HANDLE_SIZE
                    );
                    ctx.strokeRect(
                        x - HANDLE_SIZE / 2,
                        y - HANDLE_SIZE / 2,
                        HANDLE_SIZE,
                        HANDLE_SIZE
                    );
                });

                ctx.fillRect(
                    sticker.width / 2 - HANDLE_SIZE / 2,
                    -sticker.height / 2 - 20,
                    HANDLE_SIZE,
                    HANDLE_SIZE
                );
                ctx.strokeRect(
                    sticker.width / 2 - HANDLE_SIZE / 2,
                    -sticker.height / 2 - 20,
                    HANDLE_SIZE,
                    HANDLE_SIZE
                );

                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(
                    -sticker.width / 2 + 20,
                    -sticker.height / 2 - 20,
                    10,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText('X', -sticker.width / 2 + 15, -sticker.height / 2 - 15);

                ctx.restore();
            }
        });
    };

    const autoCropImage = (src: string) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = PHOTO_DISPLAY_WIDTH;
            canvas.height = PHOTO_HEIGHT;

            const aspectRatio = PHOTO_DISPLAY_WIDTH / PHOTO_HEIGHT;
            const imgAspectRatio = img.width / img.height;

            let sx, sy, sWidth, sHeight;
            if (imgAspectRatio > aspectRatio) {
                sHeight = img.height;
                sWidth = sHeight * aspectRatio;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.width;
                sHeight = sWidth / aspectRatio;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }

            ctx.drawImage(
                img,
                sx,
                sy,
                sWidth,
                sHeight,
                0,
                0,
                PHOTO_DISPLAY_WIDTH,
                PHOTO_HEIGHT
            );

            const croppedImg = new Image();
            croppedImg.onload = () => {
                setPhotos((prev) => [...prev, croppedImg]);
            };
            croppedImg.src = canvas.toDataURL('image/jpeg');
        };
        img.src = src;
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                autoCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const capturePhoto = () => {
        const webcam = webcamRef.current;
        if (webcam) {
            const imageSrc = webcam.getScreenshot();
            if (imageSrc) {
                autoCropImage(imageSrc);
            }
        }
    };

    const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                setAvailableStickers((prev) => [...prev, img]);
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                setBackgroundImage(img);
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleForegroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'image/png') {
            const img = new Image();
            img.onload = () => {
                setForegroundImage(img);
            };
            img.src = URL.createObjectURL(file);
        } else {
            alert('Vui lòng upload file PNG để hỗ trợ transparency!');
        }
    };

    const addSticker = (stickerImg: HTMLImageElement) => {
        const newSticker: Sticker = {
            id: Date.now(),
            image: stickerImg,
            x: CANVAS_WIDTH / 2,
            y: photos.length
                ? PADDING_TOP +
                (photos.length * PHOTO_HEIGHT + (photos.length - 1) * GAP) / 2
                : PHOTO_HEIGHT / 2,
            width: 100,
            height: 100,
            rotation: 0,
        };
        setStickers((prev) => [...prev, newSticker]);
        setSelectedSticker(newSticker.id);
    };

    const getStickerAtPoint = (x: number, y: number, sticker: Sticker) => {
        const cos = Math.cos((-sticker.rotation * Math.PI) / 180);
        const sin = Math.sin((-sticker.rotation * Math.PI) / 180);
        const dx = x - sticker.x;
        const dy = y - sticker.y;
        const transformedX = dx * cos - dy * sin;
        const transformedY = dx * sin + dy * cos;

        const left = -sticker.width / 2;
        const right = sticker.width / 2;
        const top = -sticker.height / 2;
        const bottom = sticker.height / 2;

        const inBounds =
            transformedX >= left &&
            transformedX <= right &&
            transformedY >= top &&
            transformedY <= bottom;

        const atResizeHandle = [
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom],
        ]
            .map(([hx, hy], i) => ({
                index: i,
                hit:
                    Math.abs(transformedX - hx) < HANDLE_SIZE &&
                    Math.abs(transformedY - hy) < HANDLE_SIZE,
            }))
            .find((h) => h.hit);

        const atRotateHandle =
            Math.abs(transformedX - right) < HANDLE_SIZE &&
            Math.abs(transformedY - (top - 20)) < HANDLE_SIZE;

        const atDeleteHandle =
            Math.sqrt(
                (transformedX - (left + 20)) ** 2 + (transformedY - (top - 20)) ** 2
            ) < 10;

        return { inBounds, atResizeHandle, atRotateHandle, atDeleteHandle };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedSticker = stickers.find((sticker) => {
            const hit = getStickerAtPoint(x, y, sticker);
            return (
                hit.inBounds ||
                hit.atResizeHandle ||
                hit.atRotateHandle ||
                hit.atDeleteHandle
            );
        });

        if (clickedSticker) {
            setSelectedSticker(clickedSticker.id);
            const hit = getStickerAtPoint(x, y, clickedSticker);

            if (hit.atDeleteHandle) {
                setStickers((prev) => prev.filter((s) => s.id !== clickedSticker.id));
                setSelectedSticker(null);
            } else if (hit.atResizeHandle) {
                setDragging('resize');
                setResizeHandle(hit.atResizeHandle.index);
            } else if (hit.atRotateHandle) {
                setDragging('rotate');
            } else if (hit.inBounds) {
                setDragging('move');
            }

            setStartX(x);
            setStartY(y);
        } else {
            setSelectedSticker(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (dragging && selectedSticker !== null) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const sticker = stickers.find((s) => s.id === selectedSticker);
            if (!sticker) return;

            const dx = x - startX;
            const dy = y - startY;

            const cos = Math.cos((sticker.rotation * Math.PI) / 180);
            const sin = Math.sin((sticker.rotation * Math.PI) / 180);

            if (dragging === 'move') {
                const moveX = dx * cos + dy * sin;
                const moveY = -dx * sin + dy * cos;
                setStickers((prev) =>
                    prev.map((s) =>
                        s.id === selectedSticker
                            ? { ...s, x: s.x + moveX, y: s.y + moveY }
                            : s
                    )
                );
            } else if (dragging === 'resize' && resizeHandle !== null) {
                const handlePoints = [
                    [-1, -1],
                    [1, -1],
                    [1, 1],
                    [-1, 1],
                ];
                const [hx, _] = handlePoints[resizeHandle];

                const localDx = dx * cos + dy * sin;
                const ratio = sticker.width / sticker.height;

                const newWidth = Math.max(20, sticker.width + hx * localDx);
                const newHeight = newWidth / ratio;

                setStickers((prev) =>
                    prev.map((s) =>
                        s.id === selectedSticker
                            ? { ...s, width: newWidth, height: newHeight }
                            : s
                    )
                );
            } else if (dragging === 'rotate') {
                const centerX = sticker.x;
                const centerY = sticker.y;
                const startAngle = Math.atan2(startY - centerY, startX - centerX);
                const currentAngle = Math.atan2(y - centerY, x - centerX);
                const angleDiff = ((currentAngle - startAngle) * 180) / Math.PI;
                setStickers((prev) =>
                    prev.map((s) =>
                        s.id === selectedSticker
                            ? { ...s, rotation: (s.rotation + angleDiff) % 360 }
                            : s
                    )
                );
            }

            setStartX(x);
            setStartY(y);
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
        setResizeHandle(null);
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'photostrip.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
            <div>
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ marginRight: '10px' }}
                    />
                    <button onClick={capturePhoto} style={{ marginRight: '10px' }}>
                        Chụp ảnh từ Webcam
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleStickerUpload}
                        style={{ marginRight: '10px' }}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        style={{ marginRight: '10px' }}
                    />
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{ marginRight: '10px' }}
                    />
                    <input
                        type="file"
                        accept="image/png"
                        onChange={handleForegroundUpload}
                        style={{ marginRight: '10px' }}
                    />
                    <button onClick={downloadImage}>Tải Photostrip</button>
                </div>

                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={CANVAS_WIDTH}
                    style={{ marginBottom: '10px', border: '1px solid black' }}
                />

                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{
                        border: '1px solid black',
                        cursor: dragging ? 'grabbing' : 'default',
                    }}
                />
            </div>

            <div>
                <h3>Stickers có sẵn</h3>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                        maxWidth: '300px',
                    }}
                >
                    {availableStickers.map((sticker, index) => (
                        <img
                            key={index}
                            src={sticker.src}
                            alt="sticker"
                            style={{ width: '50px', cursor: 'pointer' }}
                            onClick={() => addSticker(sticker)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PhotoStripEditor;
