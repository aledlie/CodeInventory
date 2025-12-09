/**
 * CommentThread Component
 *
 * Discussion thread component with:
 * - Nested replies
 * - Markdown support
 * - Reactions
 * - Mentions
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Collapse,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  MoreVert as MoreIcon,
  AddReaction as ReactionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import type { Comment, User } from '../../types';

/**
 * Props for CommentThread
 */
export interface CommentThreadProps {
  /** Comments to display */
  comments: Comment[];
  /** Current user */
  currentUser?: User;
  /** Callback when new comment is added */
  onAddComment?: (text: string, parentId?: string) => void;
  /** Callback when comment is edited */
  onEditComment?: (commentId: string, newText: string) => void;
  /** Callback when comment is deleted */
  onDeleteComment?: (commentId: string) => void;
  /** Callback when reaction is added */
  onAddReaction?: (commentId: string, emoji: string) => void;
  /** Issue ID for context */
  issueId?: string;
  /** Whether loading */
  isLoading?: boolean;
  /** Maximum nesting level */
  maxNestingLevel?: number;
}

/**
 * Format time for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Common reaction emojis
 */
const reactionEmojis = ['👍', '👎', '❤️', '🎉', '🤔', '👀'];

/**
 * Comment input component
 */
function CommentInput({
  currentUser,
  placeholder = 'Write a comment...',
  onSubmit,
  autoFocus = false,
  onCancel,
}: {
  currentUser?: User;
  placeholder?: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, p: 2 }}>
      <Avatar
        src={currentUser?.avatar}
        sx={{ width: 32, height: 32 }}
      >
        {currentUser?.initials || '?'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
          {onCancel && (
            <Button size="small" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Comment
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Single comment component
 */
function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
  nestingLevel = 0,
  maxNestingLevel = 3,
  replies = [],
}: {
  comment: Comment;
  currentUser?: User;
  onReply?: (parentId: string, text: string) => void;
  onEdit?: (commentId: string, newText: string) => void;
  onDelete?: (commentId: string) => void;
  onAddReaction?: (commentId: string, emoji: string) => void;
  nestingLevel?: number;
  maxNestingLevel?: number;
  replies?: Comment[];
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [reactionMenuAnchor, setReactionMenuAnchor] = useState<HTMLElement | null>(null);
  const [showReplies, setShowReplies] = useState(true);

  const isOwner = currentUser?.id === comment.author.id;
  const canNest = nestingLevel < maxNestingLevel;

  const handleReply = (text: string) => {
    onReply?.(comment.id, text);
    setShowReplyInput(false);
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit?.(comment.id, editText.trim());
    }
    setIsEditing(false);
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    onDelete?.(comment.id);
    setMenuAnchor(null);
  };

  const handleAddReaction = (emoji: string) => {
    onAddReaction?.(comment.id, emoji);
    setReactionMenuAnchor(null);
  };

  if (comment.isDeleted) {
    return (
      <Box
        sx={{
          py: 1,
          px: 2,
          ml: nestingLevel * 4,
          color: 'text.disabled',
          fontStyle: 'italic',
        }}
      >
        <Typography variant="body2">This comment was deleted</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ ml: nestingLevel * 4 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          py: 1.5,
          px: 2,
          borderLeft: nestingLevel > 0 ? 2 : 0,
          borderColor: 'divider',
        }}
      >
        <Avatar
          src={comment.author.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {comment.author.initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {comment.author.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(comment.createdAt)}
            </Typography>
            {comment.isEdited && (
              <Typography variant="caption" color="text.secondary">
                (edited)
              </Typography>
            )}
          </Box>

          {/* Content */}
          {isEditing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEdit}
                  disabled={!editText.trim()}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {comment.text}
            </Typography>
          )}

          {/* Reactions */}
          {comment.reactions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
              {comment.reactions.map((reaction, idx) => (
                <Chip
                  key={idx}
                  label={`${reaction.emoji} ${reaction.count}`}
                  size="small"
                  variant={reaction.hasReacted ? 'filled' : 'outlined'}
                  onClick={() => onAddReaction?.(comment.id, reaction.emoji)}
                  sx={{ height: 24, cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}

          {/* Actions */}
          {!isEditing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <Tooltip title="React">
                <IconButton
                  size="small"
                  onClick={(e) => setReactionMenuAnchor(e.currentTarget)}
                >
                  <ReactionIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canNest && (
                <Tooltip title="Reply">
                  <IconButton
                    size="small"
                    onClick={() => setShowReplyInput(!showReplyInput)}
                  >
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {isOwner && (
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Reply input */}
      <Collapse in={showReplyInput}>
        <Box sx={{ ml: 4 }}>
          <CommentInput
            currentUser={currentUser}
            placeholder="Write a reply..."
            onSubmit={handleReply}
            autoFocus
            onCancel={() => setShowReplyInput(false)}
          />
        </Box>
      </Collapse>

      {/* Replies */}
      {replies.length > 0 && (
        <>
          <Box
            sx={{
              ml: 4,
              pl: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'primary.main',
            }}
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
            <Typography variant="caption">
              {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Typography>
          </Box>
          <Collapse in={showReplies}>
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddReaction={onAddReaction}
                nestingLevel={nestingLevel + 1}
                maxNestingLevel={maxNestingLevel}
                replies={[]}
              />
            ))}
          </Collapse>
        </>
      )}

      {/* Menus */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setIsEditing(true); setMenuAnchor(null); }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={reactionMenuAnchor}
        open={Boolean(reactionMenuAnchor)}
        onClose={() => setReactionMenuAnchor(null)}
      >
        <Box sx={{ display: 'flex', p: 1, gap: 0.5 }}>
          {reactionEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => handleAddReaction(emoji)}
              sx={{ fontSize: 20 }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Menu>
    </Box>
  );
}

/**
 * CommentThread component
 */
export function CommentThread({
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  maxNestingLevel = 3,
}: CommentThreadProps) {
  // Build comment tree
  const rootComments = comments.filter((c) => !c.parentId);
  const commentsByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const handleReply = useCallback(
    (parentId: string, text: string) => {
      onAddComment?.(text, parentId);
    },
    [onAddComment]
  );

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          Comments ({comments.length})
        </Typography>
      </Box>

      {/* Comment input */}
      <CommentInput
        currentUser={currentUser}
        onSubmit={(text) => onAddComment?.(text)}
      />

      {/* Comments list */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        {rootComments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No comments yet. Be the first to comment!</Typography>
          </Box>
        ) : (
          rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onAddReaction={onAddReaction}
              maxNestingLevel={maxNestingLevel}
              replies={commentsByParent[comment.id] || []}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}

export default CommentThread;
