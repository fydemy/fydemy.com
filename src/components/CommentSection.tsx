"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronUp, CornerDownRight, User, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { formatDistanceToNow } from "@/lib/utils";

type Props = { productId: string };

export default function CommentSection({ productId }: Props) {
  const { requireAuth, user } = useRequireAuth();
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const { data: comments, isLoading } = trpc.comments.listByProduct.useQuery({ productId });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const toggleCommentUpvote = trpc.comments.toggleUpvote.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const createReply = trpc.comments.createReply.useMutation({
    onSuccess: (_, vars) => {
      setReplyTexts((prev) => ({ ...prev, [vars.commentId]: "" }));
      setReplyingTo(null);
      utils.comments.listByProduct.invalidate({ productId });
    },
  });

  const toggleReplyUpvote = trpc.comments.toggleReplyUpvote.useMutation({
    onSuccess: () => utils.comments.listByProduct.invalidate({ productId }),
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    requireAuth(() => createComment.mutate({ productId, content: commentText.trim() }));
  };

  const handlePostReply = (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    requireAuth(() => createReply.mutate({ commentId, content: text }));
  };

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">
        Comments {comments ? `(${comments.length})` : ""}
      </h3>

      {/* Comment input */}
      <div className="mb-6 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100">
          {user?.image ? (
            <Image src={user.image} alt={user.name} width={36} height={36} className="rounded-full" />
          ) : (
            <User className="h-4 w-4 text-zinc-400" />
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handlePostComment}
              disabled={createComment.isPending || !commentText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {createComment.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Post Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
                  {comment.user.image ? (
                    <Image src={comment.user.image} alt={comment.user.name} width={32} height={32} className="rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">{comment.user.name}</span>
                    <span className="text-xs text-zinc-400">
                      {formatDistanceToNow(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() =>
                        requireAuth(() => toggleCommentUpvote.mutate({ commentId: comment.id }))
                      }
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
                        comment.hasUpvoted
                          ? "bg-orange-100 text-orange-600"
                          : "text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      {comment.upvoteCount}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 ml-11 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
                        {reply.user.image ? (
                          <Image src={reply.user.image} alt={reply.user.name} width={28} height={28} className="rounded-full" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-800">{reply.user.name}</span>
                          <span className="text-xs text-zinc-400">
                            {formatDistanceToNow(new Date(reply.createdAt))}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-700">{reply.content}</p>
                        <button
                          onClick={() =>
                            requireAuth(() => toggleReplyUpvote.mutate({ replyId: reply.id }))
                          }
                          className={`mt-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
                            reply.hasUpvoted
                              ? "bg-orange-100 text-orange-600"
                              : "text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          {reply.upvoteCount}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === comment.id && (
                <div className="mt-3 ml-11 flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
                    {user?.image ? (
                      <Image src={user.image} alt={user.name} width={28} height={28} className="rounded-full" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyTexts[comment.id] ?? ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                      }
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    <div className="mt-1.5 flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="rounded-xl px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={createReply.isPending || !replyTexts[comment.id]?.trim()}
                        className="flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                      >
                        {createReply.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
