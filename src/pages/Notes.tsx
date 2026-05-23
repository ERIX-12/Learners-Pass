import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  BookMarked, 
  Plus,
  MoreVertical,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Settings2,
  ArrowRight,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import React from "react";
import { generateFlashcards } from "@/src/services/api";

interface Flashcard {
  front: string;
  back: string;
}

interface Note {
  id: string;
  title: string;
  subject: string;
  topic: string;
  createdAt: string;
  summary?: string;
  keyPoints?: string[];
  content?: string;
  labels?: string[];
}

export default function Notes() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [activeNoteForFlashcards, setActiveNoteForFlashcards] = useState<Note | null>(null);
  const [masteredCardsMap, setMasteredCardsMap] = useState<Record<string, number[]>>({
    "1": [0, 1, 2], // 3 out of 5 default completed
    "2": [] // 0 out of 5 default
  });

  const [speakingNoteId, setSpeakingNoteId] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleListen = (note: Note) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingNoteId === note.id) {
      window.speechSynthesis.cancel();
      setSpeakingNoteId(null);
    } else {
      window.speechSynthesis.cancel();

      let textToSpeak = `Note details for ${note.title}. `;
      if (note.summary) {
        textToSpeak += `Summary: ${note.summary}. `;
      } else if (note.content) {
        textToSpeak += `Content Summary: ${note.content}. `;
      }

      if (note.keyPoints && note.keyPoints.length > 0) {
        textToSpeak += `Key points to remember are: ${note.keyPoints.join(", ")}.`;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => {
        setSpeakingNoteId(null);
      };
      utterance.onerror = () => {
        setSpeakingNoteId(null);
      };

      setSpeakingNoteId(note.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Cell Division & Mitosis",
      subject: "Biology",
      topic: "Genetics",
      createdAt: "2026-05-18",
      keyPoints: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
      content: "Mitosis is a type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus, typical of ordinary tissue growth.",
      labels: ["urgent", "summary"]
    },
    {
      id: "2",
      title: "Derivatives Basics",
      subject: "Mathematics",
      topic: "Calculus",
      createdAt: "2026-05-15",
      content: "The derivative of a function of a real variable measures the sensitivity to change of the function value with respect to a change in its argument.",
      labels: ["handwritten"]
    }
  ]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedLabel, setSelectedLabel] = useState("All Labels");

  // Edit/Metadata State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isConfiguringNewNote, setIsConfiguringNewNote] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [inputTitle, setInputTitle] = useState("");
  const [inputSubject, setInputSubject] = useState("");
  const [inputTopic, setInputTopic] = useState("");
  const [inputLabels, setInputLabels] = useState<string[]>([]);
  const [customLabelInput, setCustomLabelInput] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          
          setUploadedFileName(file.name.split('.')[0]);
          setNewNoteContent("Sample content extracted from uploaded file: " + file.name + " for study guidance and flashcard synthesis.");
          
          setInputTitle(file.name.split('.')[0]);
          setInputSubject("Biology");
          setInputTopic("General");
          setInputLabels([]);
          setCustomLabelInput("");
          setIsConfiguringNewNote(true);
        }, 500);
      }
    }, 150);
  };

  const handleGenerateFlashcards = async (note: Note) => {
    setIsGenerating(true);
    setActiveNoteForFlashcards(note);
    setShowFlashcardModal(true);
    try {
      const result = await generateFlashcards(note.content || "", flashcardCount);
      const generated = result.flashcards || [];
      setFlashcards(generated);
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
      
      // Keep any pre-existing completed indices safe within the bounds
      const noteId = note.id;
      setMasteredCardsMap(prev => {
        const current = prev[noteId] || [];
        return {
          ...prev,
          [noteId]: current.filter(idx => idx < generated.length)
        };
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const distinctSubjects = ["All Subjects", ...Array.from(new Set(notes.map(n => n.subject)))];
  
  // Collect all unique labels/tags from state
  const allTags = [
    "All Labels", 
    "urgent", 
    "summary", 
    "handwritten", 
    ...(Array.from(new Set(notes.flatMap(n => n.labels || []))) as string[]).filter(t => !["urgent", "summary", "handwritten"].includes(t))
  ];

  // Filtering Logic
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSubject = selectedSubject === "All Subjects" || note.subject === selectedSubject;
    const matchesLabel = selectedLabel === "All Labels" || (note.labels && note.labels.includes(selectedLabel));
    
    return matchesSearch && matchesSubject && matchesLabel;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight" id="notes-title-header">Study Materials</h2>
          <p className="text-slate-500 mt-1">Manage and revise your uploaded notes.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => {
              setInputTitle("");
              setInputSubject("Biology");
              setInputTopic("General");
              setInputLabels([]);
              setCustomLabelInput("");
              setIsConfiguringNewNote(false);
              setShowUploadModal(true);
            }}
            className="btn-primary flex items-center gap-2 cursor-pointer"
            id="btn-add-note"
          >
            <Plus size={20} />
            Add Note
          </button>
        </div>
      </header>

      {/* Filter panel */}
      <div className="bg-slate-50/50 border border-slate-100/80 rounded-3xl p-6 mb-8 space-y-4">
        {/* Subject Filter row */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Filter by Subject</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {distinctSubjects.map((subj) => (
              <button 
                key={subj} 
                onClick={() => setSelectedSubject(subj)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  selectedSubject === subj 
                    ? "bg-primary text-white" 
                    : "bg-white text-slate-600 border border-slate-200 hover:border-primary"
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Labels/Tags Filter row */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
            <Filter size={12} />
            Filter by Tag / Label
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {allTags.map((tag) => {
              let style = "bg-white text-slate-600 border border-slate-205 hover:bg-slate-50";
              if (selectedLabel === tag) {
                if (tag === "All Labels") style = "bg-slate-900 text-white border-slate-900";
                else if (tag === "urgent") style = "bg-red-500 text-white border-red-500";
                else if (tag === "summary") style = "bg-amber-500 text-white border-amber-500";
                else if (tag === "handwritten") style = "bg-emerald-500 text-white border-emerald-500";
                else style = "bg-primary text-white border-primary";
              }
              
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedLabel(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer",
                    style
                  )}
                >
                  {tag === "urgent" && "🚨"}
                  {tag === "summary" && "📝"}
                  {tag === "handwritten" && "✍️"}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <motion.div 
            layoutId={note.id}
            key={note.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group flex flex-col justify-between"
          >
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleListen(note)}
                      className={cn(
                        "p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center",
                        speakingNoteId === note.id
                          ? "bg-primary/10 border-primary/20 text-primary animate-pulse shadow-sm"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      )}
                      title={speakingNoteId === note.id ? "Stop reading summary" : "Listen to summary"}
                      id={`btn-listen-${note.id}`}
                    >
                      {speakingNoteId === note.id ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingNote(note);
                        setInputTitle(note.title);
                        setInputSubject(note.subject);
                        setInputTopic(note.topic);
                        setInputLabels(note.labels || []);
                        setCustomLabelInput("");
                        setShowEditModal(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      title="Edit note details"
                      id={`btn-edit-${note.id}`}
                    >
                      <Settings2 size={18} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-primary transition-colors">{note.title}</h3>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {note.subject}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400">{note.topic}</span>
                </div>

                {/* Tags section inside card */}
                {note.labels && note.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4 pt-1">
                    {note.labels.map(label => {
                      let tagStyle = "bg-slate-50 text-slate-500 border-slate-100";
                      if (label === "urgent") tagStyle = "bg-red-50 text-red-600 border-red-100/50 border";
                      else if (label === "summary") tagStyle = "bg-amber-50 text-amber-600 border border-amber-100/50";
                      else if (label === "handwritten") tagStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100/50";
                      else tagStyle = "bg-indigo-50/50 text-indigo-600 border border-indigo-100/30";
                      
                      return (
                        <span key={label} className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1", tagStyle)}>
                          {label === "urgent" && "🚨"}
                          {label === "summary" && "📝"}
                          {label === "handwritten" && "✍️"}
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {note.keyPoints && (
                   <div className="flex flex-wrap gap-1 mb-4">
                     {note.keyPoints.map(kp => (
                       <span key={kp} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                         {kp}
                       </span>
                     ))}
                   </div>
                 )}

                 {/* Visual Progress Bar */}
                 {(() => {
                   const masteredIndices = masteredCardsMap[note.id] || [];
                   const reviewedCount = masteredIndices.length;
                   // If we are currently revising, we can dynamically pull the active length, otherwise use standard count of 5
                   const totalCount = (activeNoteForFlashcards?.id === note.id && flashcards.length > 0)
                     ? flashcards.length
                     : 5;
                  
                   const percentage = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;
                  
                   return (
                     <div className="mt-3 mb-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-slate-50/80 transition-all duration-300">
                       <div className="flex items-center justify-between mb-1.5">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flashcards Mastered</span>
                         <span className="text-[10px] font-extrabold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                           {percentage}% ({reviewedCount}/{totalCount})
                         </span>
                       </div>
                       <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                         <div 
                           className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                           style={{ width: `${percentage}%` }}
                         />
                       </div>
                       {percentage === 100 && (
                         <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 font-bold leading-none animate-pulse">
                           <CheckCircle2 size={12} className="text-emerald-500" />
                           <span>Complete Mastery achieved!</span>
                         </div>
                       )}
                     </div>
                   );
                 })()}
               </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                <button 
                  onClick={() => handleGenerateFlashcards(note)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
                >
                  <Layers size={14} />
                  <span>Generate Flashcards</span>
                </button>
                <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
                  Revise <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="upload-dialog-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUploadModal(false);
                setIsConfiguringNewNote(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
              id="upload-dialog-container"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900">
                  {isConfiguringNewNote ? "Note Details & Labels" : "Upload Notes"}
                </h3>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setIsConfiguringNewNote(false);
                  }}
                  className="p-[6px] hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              {isConfiguringNewNote ? (
                <div className="p-6 space-y-4" id="form-new-note-metadata">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Title</label>
                    <input 
                      type="text" 
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      placeholder="e.g. Mitochondria study"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Subject</label>
                      <input 
                        type="text" 
                        value={inputSubject}
                        onChange={(e) => setInputSubject(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                        placeholder="e.g. Biology"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Topic</label>
                      <input 
                        type="text" 
                        value={inputTopic}
                        onChange={(e) => setInputTopic(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                        placeholder="e.g. Genetics"
                      />
                    </div>
                  </div>

                  {/* Tag additions */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">Select Tags / Labels</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        { id: "urgent", label: "🚨 Urgent" },
                        { id: "summary", label: "📝 Summary" },
                        { id: "handwritten", label: "✍️ Handwritten" }
                      ].map((pill) => {
                        const isSelected = inputLabels.includes(pill.id);
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setInputLabels(inputLabels.filter(l => l !== pill.id));
                              } else {
                                setInputLabels([...inputLabels, pill.id]);
                              }
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer",
                              isSelected 
                                ? "bg-slate-900 border-slate-900 text-white" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {pill.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Custom tag input in modal */}
                    <div className="flex gap-2 mt-3">
                      <input 
                        type="text" 
                        value={customLabelInput}
                        onChange={(e) => setCustomLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = customLabelInput.trim().toLowerCase();
                            if (val && !inputLabels.includes(val)) {
                              setInputLabels([...inputLabels, val]);
                              setCustomLabelInput("");
                            }
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Add custom tag (press Enter)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = customLabelInput.trim().toLowerCase();
                          if (val && !inputLabels.includes(val)) {
                            setInputLabels([...inputLabels, val]);
                            setCustomLabelInput("");
                          }
                        }}
                        className="px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {inputLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100">
                        {inputLabels.map(l => (
                          <span key={l} className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {l === "urgent" && "🚨"}
                            {l === "summary" && "📝"}
                            {l === "handwritten" && "✍️"}
                            {l}
                            <button 
                              type="button"
                              onClick={() => setInputLabels(inputLabels.filter(item => item !== l))}
                              className="hover:text-red-500 font-extrabold ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfiguringNewNote(false);
                        setShowUploadModal(false);
                      }}
                      className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!inputTitle.trim()) return;
                        setNotes([...notes, {
                          id: Math.random().toString(),
                          title: inputTitle.trim(),
                          subject: inputSubject.trim() || "General",
                          topic: inputTopic.trim() || "General",
                          labels: inputLabels,
                          createdAt: new Date().toISOString().split('T')[0],
                          content: newNoteContent
                        }]);
                        setIsConfiguringNewNote(false);
                        setShowUploadModal(false);
                      }}
                      className="btn-primary cursor-pointer"
                      id="save-new-note"
                    >
                      Save & Create Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  {!isUploading ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <FileUp className="text-primary" size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">Drag & Drop notes</h4>
                        <p className="text-sm text-slate-500 mt-1">PDF, DOCX, PPT, or Images (OCR Supported)</p>
                      </div>
                      <label className="btn-primary inline-flex cursor-pointer transition-all hover:scale-[1.02]">
                        <span>Browse Files</span>
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" />
                      </label>
                    </div>
                  ) : (
                    <div className="py-8 space-y-6 animate-fade-in">
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                          <circle 
                            className="text-primary stroke-current" strokeWidth="8" strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" 
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{uploadProgress}%</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Analyzing your notes with AI...</h4>
                        <p className="text-sm text-slate-500 mt-1">Extracting key concepts and summaries</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {showFlashcardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFlashcardModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Layers className="text-primary" size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">Flashcard Revision</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <Settings2 size={14} className="text-slate-400" />
                    <select 
                      value={flashcardCount} 
                      onChange={(e) => setFlashcardCount(Number(e.target.value))}
                      className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent"
                    >
                      {[5, 10, 15, 20].map(n => (
                        <option key={n} value={n}>{n} cards</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setShowFlashcardModal(false)}
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-12">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <p className="font-bold text-slate-900">Generating study cards...</p>
                    <p className="text-sm text-slate-500">Extracting key concepts from your notes</p>
                  </div>
                ) : flashcards.length > 0 ? (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                      <span>CARD {currentFlashcardIndex + 1} OF {flashcards.length}</span>
                      <div className="flex gap-1">
                        {flashcards.map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              i === currentFlashcardIndex ? "w-8 bg-primary" : "w-2 bg-slate-100"
                            )} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="perspective-1000 h-[300px] w-full">
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        className="relative w-full h-full preserve-3d cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-100 rounded-3xl shadow-xl flex items-center justify-center p-8 text-center">
                          <p className="text-2xl font-bold text-slate-900 leading-tight">
                            {flashcards[currentFlashcardIndex].front}
                          </p>
                          <span className="absolute bottom-6 text-[10px] uppercase tracking-widest font-bold text-slate-300">Click to reveal</span>
                        </div>

                        {/* Back */}
                        <div 
                          className="absolute inset-0 backface-hidden bg-primary rounded-3xl shadow-xl flex items-center justify-center p-8 text-center"
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <p className="text-xl font-medium text-white leading-relaxed">
                            {flashcards[currentFlashcardIndex].back}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Mastery Toggle Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-100/80 rounded-2xl">
                      <div className="text-center sm:text-left">
                        <span className="text-xs font-bold text-slate-800 block">Successfully reviewed this card?</span>
                        <span className="text-[10px] text-slate-400 font-medium">Toggle status to update your overall study progress.</span>
                      </div>
                      {(() => {
                        const noteId = activeNoteForFlashcards?.id || "";
                        const masteredList = masteredCardsMap[noteId] || [];
                        const isCurrentlyMastered = masteredList.includes(currentFlashcardIndex);
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (!noteId) return;
                              setMasteredCardsMap(prev => {
                                const current = prev[noteId] || [];
                                let next;
                                if (current.includes(currentFlashcardIndex)) {
                                  next = current.filter(i => i !== currentFlashcardIndex);
                                } else {
                                  next = [...current, currentFlashcardIndex];
                                }
                                return {
                                  ...prev,
                                  [noteId]: next
                                };
                              });
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border duration-200 shadow-sm active:scale-95",
                              isCurrentlyMastered
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-205"
                            )}
                          >
                            <CheckCircle2 size={14} className={isCurrentlyMastered ? "text-white" : "text-emerald-500"} />
                            <span>{isCurrentlyMastered ? "Mastered! \u2713" : "Mark as Mastered"}</span>
                          </button>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between gap-4">
                      <button 
                        disabled={currentFlashcardIndex === 0}
                        onClick={() => {
                          setCurrentFlashcardIndex(prev => prev - 1);
                          setIsFlipped(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        <ChevronLeft size={20} />
                        Previous
                      </button>
                      <button 
                         disabled={currentFlashcardIndex === flashcards.length - 1}
                        onClick={() => {
                          setCurrentFlashcardIndex(prev => prev + 1);
                          setIsFlipped(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        Next
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Failed to generate flashcards. Please try again.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showEditModal && editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="edit-dialog-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                setEditingNote(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
              id="edit-dialog-container"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Edit Note Details</h3>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingNote(null);
                  }}
                  className="p-[6px] hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4" id="form-edit-note-metadata">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Title</label>
                  <input 
                    type="text" 
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Subject</label>
                    <input 
                      type="text" 
                      value={inputSubject}
                      onChange={(e) => setInputSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Topic</label>
                    <input 
                      type="text" 
                      value={inputTopic}
                      onChange={(e) => setInputTopic(e.target.value)}
                      className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                </div>

                {/* Tag checkable pills */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Select Tags / Labels</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { id: "urgent", label: "🚨 Urgent" },
                      { id: "summary", label: "📝 Summary" },
                      { id: "handwritten", label: "✍️ Handwritten" }
                    ].map((pill) => {
                      const isSelected = inputLabels.includes(pill.id);
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setInputLabels(inputLabels.filter(l => l !== pill.id));
                            } else {
                              setInputLabels([...inputLabels, pill.id]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer",
                            isSelected 
                              ? "bg-slate-900 border-slate-900 text-white" 
                              : "bg-white border-slate-205 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom tag input */}
                  <div className="flex gap-2 mt-3">
                    <input 
                      type="text" 
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = customLabelInput.trim().toLowerCase();
                          if (val && !inputLabels.includes(val)) {
                            setInputLabels([...inputLabels, val]);
                            setCustomLabelInput("");
                          }
                        }
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Add custom tag (press Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customLabelInput.trim().toLowerCase();
                        if (val && !inputLabels.includes(val)) {
                          setInputLabels([...inputLabels, val]);
                          setCustomLabelInput("");
                        }
                      }}
                      className="px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {inputLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100">
                      {inputLabels.map(l => (
                        <span key={l} className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {l === "urgent" && "🚨"}
                          {l === "summary" && "📝"}
                          {l === "handwritten" && "✍️"}
                          {l}
                          <button 
                            type="button"
                            onClick={() => setInputLabels(inputLabels.filter(item => item !== l))}
                            className="hover:text-red-500 font-extrabold ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingNote(null);
                    }}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!inputTitle.trim()) return;
                      setNotes(notes.map(n => n.id === editingNote.id ? {
                        ...n,
                        title: inputTitle.trim(),
                        subject: inputSubject.trim() || "General",
                        topic: inputTopic.trim() || "General",
                        labels: inputLabels
                      } : n));
                      setShowEditModal(false);
                      setEditingNote(null);
                    }}
                    className="btn-primary cursor-pointer"
                    id="save-edit-note"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
