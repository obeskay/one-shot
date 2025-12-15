import React, { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { useToast } from '../../../contexts/ToastContext';
import { copyToClipboard } from '../../../utils/clipboard';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildPayload: () => Promise<string>;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, buildPayload }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            buildPayload().then(text => {
                setContent(text);
                setLoading(false);
            });
        }
    }, [isOpen]);

    const handleCopy = async () => {
        await copyToClipboard(content);
        addToast('success', 'Copied');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payload Preview">
            <div className="flex flex-col h-[60vh]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-secondary font-mono text-xs">
                        processing...
                    </div>
                ) : (
                    <textarea 
                        className="flex-1 bg-surface/30 border border-border p-4 font-mono text-[10px] text-secondary resize-none outline-none focus:border-secondary transition-colors rounded-sm leading-relaxed"
                        value={content}
                        readOnly
                    />
                )}
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleCopy} variant="primary">
                        Confirm Copy
                    </Button>
                </div>
            </div>
        </Modal>
    );
};