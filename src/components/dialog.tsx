'use client'

import { useEffect, useRef } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 bg-white rounded-2xl p-0 max-w-lg w-full shadow-xl"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="p-6 border-b border-[#E5E7EB]">
        <h2 className="text-xl font-bold text-[#2D3142]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
      {footer && (
        <div className="p-6 pt-0 flex gap-3">
          {footer}
        </div>
      )}
    </dialog>
  )
}

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary'
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-[#6B7280]">{message}</p>
    </Dialog>
  )
}
