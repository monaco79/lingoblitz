import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CloseIcon from './icons/CloseIcon';
// @ts-ignore - Vite allows importing as raw string
import readmeContent from '../README.md?raw';

interface InfoModalProps {
    onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lingoblitz shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white z-10"
                >
                    <CloseIcon />
                </button>

                <div className="prose dark:prose-invert max-w-none font-aleo">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => <h1 className="font-poppins text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#004AAD] to-[#CB6CE6] mb-6" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="font-poppins text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="font-poppins text-xl font-medium mt-6 mb-3 text-gray-800 dark:text-gray-200" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 text-gray-600 dark:text-gray-300 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-600 dark:text-gray-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-600 dark:text-gray-300" {...props} />,
                            li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                            a: ({ node, ...props }) => <a className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({ node, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !match ? (
                                    <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono text-purple-600 dark:text-purple-300" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                )
                            },
                            table: ({ node, ...props }) => <div className="overflow-x-auto mb-6"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-700/50" {...props} />,
                            th: ({ node, ...props }) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" {...props} />,
                            tbody: ({ node, ...props }) => <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
                            td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
                        }}
                    >
                        {readmeContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;
