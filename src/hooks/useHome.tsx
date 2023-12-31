import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { parseCookies, setCookie } from "nookies";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { env } from "~/env.mjs";

export type ModalState = {
  isOpen: boolean;
  type: "join" | "redirect" | undefined;
};

export const useHome = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: "join",
  });
  const [enterAsSpec, setEnterAsSpec] = useState(false);
  const [isJoinSessionModalOpen, setIsJoinSessionModalOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const { data: user, refetch } = useQuery(["user"], async () => {
    const cookies = parseCookies();
    const user = JSON.parse(cookies.user || "{}");
    return user as { name: string; id: string };
  });

  const handleRedirectToSession = useCallback(
    async (passBy?: boolean | undefined) => {
      const url = `/session/${sessionId}?userId=${user?.id}&username=${user?.name}&enterAsSpec=${enterAsSpec}`;
      if (passBy) {
        router.push(url);
        return;
      }

      const sessions = await fetch(`${env.NEXT_PUBLIC_API_URL}/sessions`, {
        method: "GET",
      }).then((res) => res.json());

      const findSession = sessions?.find(
        (session: any) => session.sessionId === sessionId
      ) as { id: string; users: { id: string }[] };
      if (!findSession) {
        setError("Sessão não encontrada.");
        setTimeout(() => {
          setError("");
        }, 3000);
        return;
      }
      router.push(url);
    },
    [enterAsSpec, router, sessionId, user?.id, user?.name]
  );

  const handleStartSession = async (copyUrl?: boolean) => {
    const sessionId = uuidv4();
    if (copyUrl) {
      const url = `${window.location.origin}/session/${sessionId}`;
      await navigator.clipboard.writeText(url);
    }
    setIsLoading(false);
    setSessionId(sessionId);
    setIsRedirectModalOpen(true);
  };

  const handleCreateUserAndStartSession = async (copyUrl?: boolean) => {
    setIsLoading(true);
    const user = {
      name: username,
      id: uuidv4(),
    };
    refetch();
    setCookie(null, "user", JSON.stringify(user));
    await handleStartSession(copyUrl);
  };

  useEffect(() => {
    refetch();
  }, [refetch, sessionId]);

  const hasUser = Object.keys(user ?? {}).length > 0;

  return {
    isJoinSessionModalOpen,
    setIsJoinSessionModalOpen,
    isRedirectModalOpen,
    setIsRedirectModalOpen,
    isLoading,
    username,
    setUsername,
    sessionId,
    user,
    handleStartSession,
    handleCreateUserAndStartSession,
    handleRedirectToSession,
    setSessionId,
    modalState,
    setModalState,
    hasUser,
    setEnterAsSpec,
    enterAsSpec,
    error,
  };
};
