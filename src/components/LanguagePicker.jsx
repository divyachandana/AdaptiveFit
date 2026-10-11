import React, { useState } from "react";
import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, getLanguage, setLanguage } from "@/lib/af/languages";

export default function LanguagePicker() {
  const [lang, setLang] = useState(getLanguage());
  const change = (code) => { setLang(code); setLanguage(code); };
  return (
    <Select value={lang} onValueChange={change}>
      <SelectTrigger className="h-11 w-auto gap-2 rounded-xl" aria-label="Voice language">
        <Globe className="w-4 h-4" /><SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}