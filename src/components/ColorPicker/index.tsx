// components/ColorPicker/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from '../../utils/colors';
import './styles.css';

interface ColorPickerProps {
    value: string; // Controlled value for the selected color
    onColorChange: (color: string) => void; // Callback to pass selected color to parent
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onColorChange }) => {
    const defaultColors = ['#FFFFFF', '#000000', '#FF69B4'];
    const [showPicker, setShowPicker] = useState<boolean>(false);

    // Initialize RGB and HSL values based on the current value
    const rgb = hexToRgb(value);
    const { h: initialHue, s: initialSaturation, l: initialLightness } = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const [hue, setHue] = useState<number>(initialHue);
    const [saturation, setSaturation] = useState<number>(initialSaturation);
    const [lightness, setLightness] = useState<number>(initialLightness);

    const spectrumRef = useRef<HTMLCanvasElement>(null);
    const hueSliderRef = useRef<HTMLDivElement>(null);
    const [spectrumPosition, setSpectrumPosition] = useState<{ x: number; y: number }>({
        x: (initialSaturation / 100) * 200,
        y: (1 - initialLightness / 100) * 200,
    });

    // Draw the color spectrum on the canvas when showPicker or hue changes
    useEffect(() => {
        const canvas = spectrumRef.current;
        if (!canvas || !showPicker) return; // Only draw if canvas exists and picker is open
        console.log('Drawing spectrum with hue:', hue); // Debug log

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const s = (x / width) * 100;
                const l = (1 - y / height) * 100;
                const { r, g, b } = hslToRgb(hue, s, l);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }, [hue, showPicker]); // Added showPicker to dependencies

    // Sync internal HSL state when the value prop changes
    useEffect(() => {
        const newRgb = hexToRgb(value);
        const { h, s, l } = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        setSpectrumPosition({
            x: (s / 100) * 200,
            y: (1 - l / 100) * 200,
        });
    }, [value]);

    const handleColorSelect = (color: string) => {
        onColorChange(color);
        setShowPicker(false);
    };

    // Update the color when the user interacts with the spectrum or sliders
    const updateColor = (h: number, s: number, l: number) => {
        const { r, g, b } = hslToRgb(h, s, l);
        const newColor = rgbToHex(r, g, b);
        onColorChange(newColor);
    };

    // Handle clicking/dragging on the spectrum
    const handleSpectrumInteraction = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
        const canvas = spectrumRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), canvas.width);
        const y = Math.min(Math.max(e.clientY - rect.top, 0), canvas.height);

        setSpectrumPosition({ x, y });
        const newSaturation = (x / canvas.width) * 100;
        const newLightness = (1 - y / canvas.height) * 100;
        setSaturation(newSaturation);
        setLightness(newLightness);
        updateColor(hue, newSaturation, newLightness);
    };

    const handleSpectrumMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        handleSpectrumInteraction(e);
        window.addEventListener('mousemove', handleSpectrumInteraction);
        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', handleSpectrumInteraction);
        });
    };

    // Handle hue slider
    const handleHueInteraction = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        const slider = hueSliderRef.current;
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const newHue = (x / rect.width) * 360;
        setHue(newHue);
        updateColor(newHue, saturation, lightness);
    };

    const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        handleHueInteraction(e);
        window.addEventListener('mousemove', handleHueInteraction);
        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', handleHueInteraction);
        });
    };

    // RGB inputs
    const handleRgbChange = (type: 'r' | 'g' | 'b', newValue: string) => {
        const num = Math.min(255, Math.max(0, parseInt(newValue) || 0));
        const newRgb = {
            ...rgb,
            [type]: num,
        };
        const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        onColorChange(newColor);
    };

    return (
        <div className="color-picker-container">
            <div className="color-swatches">
                {defaultColors.map((color, index) => (
                    <div
                        key={index}
                        className={`color-swatch ${value === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelect(color)}
                    />
                ))}
                <div
                    className="color-swatch picker-button"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    🎨
                </div>
            </div>

            {showPicker && (
                <div className="color-picker-popover">
                    {/* Color Spectrum */}
                    <div className="spectrum-container">
                        <canvas
                            ref={spectrumRef}
                            width={200}
                            height={200}
                            onMouseDown={handleSpectrumMouseDown}
                        />
                        <div
                            className="spectrum-selector"
                            style={{
                                left: spectrumPosition.x - 5,
                                top: spectrumPosition.y - 5,
                            }}
                        />
                    </div>

                    {/* Hue Slider */}
                    <div className="hue-slider" ref={hueSliderRef} onMouseDown={handleHueMouseDown}>
                        <div
                            className="hue-slider-handle"
                            style={{ left: `${(hue / 360) * 100}%` }}
                        />
                    </div>

                    {/* RGB Inputs */}
                    <div className="color-values">
                        <div>
                            <label>R</label>
                            <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.r}
                                onChange={(e) => handleRgbChange('r', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>G</label>
                            <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.g}
                                onChange={(e) => handleRgbChange('g', e.target.value)}
                            />
                        </div>
                        <div>
                            <label>B</label>
                            <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb.b}
                                onChange={(e) => handleRgbChange('b', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="color-picker-preview-container">
                        <div className="color-picker-preview" style={{ backgroundColor: value }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPicker;