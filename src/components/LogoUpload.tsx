// src/components/LogoUpload.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface LogoUploadProps {
  currentLogo?: string | null;
  onLogoChange?: (url: string) => void;
}

export default function LogoUpload({ currentLogo, onLogoChange }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local imediato
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer upload.");
        return;
      }

      setSuccess(true);
      onLogoChange?.(data.url);

      // Salvar a URL no localStorage para persistência simples
      localStorage.setItem("estabelecimento_logo", data.url);
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setSuccess(false);
    localStorage.removeItem("estabelecimento_logo");
    onLogoChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="logo-upload-container">
      <label className="logo-upload-label">Logo do Estabelecimento</label>
      <p className="logo-upload-hint">
        Recomendado: PNG ou SVG com fundo transparente, mínimo 200×200px.
      </p>

      <div className="logo-upload-area">
        {preview ? (
          <div className="logo-preview-wrapper">
            <img
              src={preview}
              alt="Logo do estabelecimento"
              className="logo-preview-img"
            />
            <div className="logo-preview-actions">
              <button
                type="button"
                className="btn-change-logo"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Trocar logo"}
              </button>
              <button
                type="button"
                className="btn-remove-logo"
                onClick={handleRemove}
                disabled={loading}
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="logo-dropzone"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            <span className="logo-dropzone-icon">🖼️</span>
            <span className="logo-dropzone-text">
              {loading ? "Enviando..." : "Clique para adicionar sua logo"}
            </span>
            <span className="logo-dropzone-sub">PNG, JPG, SVG ou WebP</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {error && <p className="logo-upload-error">⚠️ {error}</p>}
      {success && <p className="logo-upload-success">✅ Logo salva com sucesso!</p>}

      <style jsx>{`
        .logo-upload-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .logo-upload-label {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
        }
        .logo-upload-hint {
          font-size: 12px;
          color: #888;
          margin: 0;
        }
        .logo-upload-area {
          margin-top: 8px;
        }
        .logo-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 32px 16px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          background: #fafafa;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .logo-dropzone:hover:not(:disabled) {
          border-color: #10b981;
          background: #f0fdf4;
        }
        .logo-dropzone:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .logo-dropzone-icon {
          font-size: 32px;
        }
        .logo-dropzone-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .logo-dropzone-sub {
          font-size: 12px;
          color: #9ca3af;
        }
        .logo-preview-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }
        .logo-preview-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
          background: #f9fafb;
          padding: 4px;
        }
        .logo-preview-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn-change-logo {
          padding: 7px 16px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-change-logo:hover:not(:disabled) {
          background: #059669;
        }
        .btn-change-logo:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-remove-logo {
          padding: 7px 16px;
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-remove-logo:hover:not(:disabled) {
          background: #fef2f2;
        }
        .logo-upload-error {
          font-size: 13px;
          color: #ef4444;
          margin: 4px 0 0;
        }
        .logo-upload-success {
          font-size: 13px;
          color: #10b981;
          margin: 4px 0 0;
        }
      `}</style>
    </div>
  );
}