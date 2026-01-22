// src/components/AutoPoster.jsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const LAYOUTS = {
    hero: { label: "Center Focus", container: "justify-center items-center text-center", overlay: "bg-black/40" },
    cinematic: { label: "Bottom Fade", container: "justify-end pb-8 px-6 text-left", overlay: "bg-gradient-to-t from-black via-black/60 to-transparent" },
    magazine: { label: "Top Left", container: "justify-start pt-8 px-6 text-left items-start", overlay: "bg-gradient-to-b from-black/80 via-transparent to-transparent" }
};

const AutoPoster = ({ aiBackgroundImage, collegeName, eventName, date, venue, onPosterReady }) => {
    const posterRef = useRef(null);
    const [currentLayout, setCurrentLayout] = useState('hero');
    const style = LAYOUTS[currentLayout];

    const handleFinalize = async () => {
        if (!posterRef.current) return;
        try {
            const canvas = await html2canvas(posterRef.current, { useCORS: true, scale: 2 });
            canvas.toBlob((blob) => {
                onPosterReady(blob); // Sends the file back to the form
            }, 'image/jpeg', 0.9);
        } catch (error) {
            console.error("Error capturing poster:", error);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-sky-400 font-bold">AI Preview & Customization</h3>
            
            {/* Layout Switcher */}
            <div className="flex gap-2">
                {Object.keys(LAYOUTS).map((key) => (
                    <button key={key} type="button" onClick={() => setCurrentLayout(key)}
                        className={`px-3 py-1 text-xs rounded border ${currentLayout === key ? 'bg-sky-600 border-sky-500 text-white' : 'border-slate-600 text-gray-400'}`}>
                        {LAYOUTS[key].label}
                    </button>
                ))}
            </div>

            {/* The Canvas (What becomes the image) */}
            <div ref={posterRef} className="relative w-[300px] h-[400px] bg-slate-900 overflow-hidden shadow-2xl">
                {/* 1. AI Image */}
                <img src={aiBackgroundImage} alt="AI Background" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                
                {/* 2. Readability Overlay */}
                <div className={`absolute inset-0 ${style.overlay}`} />

                {/* 3. Text Content */}
                <div className={`absolute inset-0 flex flex-col z-10 p-6 ${style.container}`}>
                    <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-1">{collegeName}</p>
                    <h1 className="text-3xl font-black uppercase text-white drop-shadow-lg leading-tight mb-2">{eventName}</h1>
                    <div className="mt-2 text-sm font-medium text-sky-300">
                        <p>📅 {date}</p>
                        <p>📍 {venue}</p>
                    </div>
                </div>
            </div>

            <button onClick={handleFinalize} type="button" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded">
                ✅ Use This Design
            </button>
        </div>
    );
};

export default AutoPoster;