import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Download } from "lucide-react";
import { MediaItem } from "../types";
import { Button } from "./Button";
import { openMediaInNewTab } from "../lib/mediaUtils";

interface MediaViewerProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ item, onClose }) => {
  const handleOpenOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item) return;
    openMediaInNewTab(item.url);
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls */}
            <div className="absolute -top-14 right-0 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full"
                onClick={handleOpenOriginal}
              >
                <ExternalLink size={18} className="mr-2" />
                Open Original
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-white/10 hover:bg-white/20 border border-white/10 w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X size={24} />
              </Button>
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl">
              {item.type === "image" && (
                <img
                  src={item.url}
                  alt={item.title || "Image Preview"}
                  className="max-w-full max-h-[80vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              {item.type === "video" && (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
              {item.type === "audio" && (
                <div className="p-12 bg-zinc-800 rounded-3xl w-full max-w-md flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-zinc-700 rounded-full flex items-center justify-center text-white">
                    <Download size={32} />
                  </div>
                  <audio src={item.url} controls className="w-full" />
                  <p className="text-white font-bold text-center">{item.title || "Audio File"}</p>
                </div>
              )}
              {item.type === "link" && (
                <div className="p-12 bg-zinc-800 rounded-3xl w-full max-w-md flex flex-col items-center gap-6 text-center">
                  <ExternalLink size={48} className="text-zinc-400" />
                  <div className="space-y-2">
                    <p className="text-white font-bold text-xl">{item.title || "External Link"}</p>
                    <p className="text-zinc-400 text-sm break-all">{item.url}</p>
                  </div>
                  <Button variant="primary" onClick={() => openMediaInNewTab(item.url)}>
                    Visit Link
                  </Button>
                </div>
              )}
            </div>

            {item.title && (
              <div className="mt-4 text-white font-medium text-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {item.title}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
