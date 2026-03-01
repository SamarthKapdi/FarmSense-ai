import React from "react";

const languages = [
    { code: "en", label: "EN", flag: "🇮🇳" },
    { code: "hi", label: "हिं", flag: "" },
    { code: "ta", label: "தமி", flag: "" },
    { code: "te", label: "తెలు", flag: "" },
    { code: "mr", label: "मरा", flag: "" },
    { code: "pa", label: "ਪੰਜਾ", flag: "" },
];

export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`lang-pill flex-shrink-0 ${selectedLanguage === lang.code ? "lang-pill-active" : ""
                        }`}
                >
                    {lang.flag && <span className="mr-1">{lang.flag}</span>}
                    {lang.label}
                </button>
            ))}
        </div>
    );
}
