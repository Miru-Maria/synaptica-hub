import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Trash2, ChevronLeft, User, Bot, CheckCircle, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail: string;
  leadCaptured: boolean;
  pipelineContactId?: string;
  messageCount: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ChatSessionsViewer() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat-sessions", { headers: authHeaders() });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadTranscript = async (session: ChatSession) => {
    setLoadingTranscript(true);
    try {
      const res = await fetch(`/api/admin/chat-sessions/${session.id}`, { headers: authHeaders() });
      if (res.ok) {
        const fullSession = await res.json();
        setSelectedSession(fullSession);
      } else {
        setSelectedSession(session);
      }
    } catch {
      setSelectedSession(session);
    }
    setLoadingTranscript(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat-sessions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (selectedSession?.id === id) setSelectedSession(null);
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mr-2" />
        <p className="text-neutral-400">Loading chat sessions...</p>
      </div>
    );
  }

  if (loadingTranscript) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mr-2" />
        <p className="text-neutral-400">Loading transcript...</p>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSession(null)}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-neutral-200 truncate">
              {selectedSession.visitorName || "Anonymous Visitor"}
              {selectedSession.visitorEmail && (
                <span className="text-neutral-500 font-normal ml-2">({selectedSession.visitorEmail})</span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-500">
              {new Date(selectedSession.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
              {selectedSession.leadCaptured && (
                <span className="ml-2 text-emerald-400 inline-flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> Lead Captured
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {selectedSession.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "user"
                  ? "bg-blue-500/15"
                  : "bg-emerald-500/15"
              }`}>
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                    {msg.role === "user" ? "Visitor" : "Assistant"}
                  </span>
                  <span className="text-[10px] text-neutral-600">
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed bg-neutral-800/50 rounded-lg px-3 py-2">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500">No chat sessions yet.</p>
            <p className="text-neutral-600 text-xs mt-1">Conversations from the AI chat widget will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
              onClick={() => loadTranscript(session)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    session.leadCaptured ? "bg-emerald-500/15" : "bg-neutral-800"
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      session.leadCaptured ? "text-emerald-400" : "text-neutral-500"
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-100 text-sm">
                        {session.visitorName || "Anonymous Visitor"}
                      </span>
                      {session.visitorEmail && (
                        <span className="text-neutral-500 text-xs">{session.visitorEmail}</span>
                      )}
                      {session.leadCaptured && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Lead Captured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                      <span>{session.messageCount} messages</span>
                      <span className="text-neutral-700">|</span>
                      <span>
                        {new Date(session.updatedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    className="text-neutral-500 hover:text-red-400 h-7 w-7 p-0 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
