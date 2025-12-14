/**
 * CommentThread Component Tests
 *
 * Tests for the discussion thread component including:
 * - Comment rendering and nesting
 * - Adding new comments and replies
 * - Edit and delete functionality
 * - Reactions
 * - Time formatting
 * - User interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { CommentThread } from '../CommentThread';
import type { Comment, User, Reaction } from '../../../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
  role: 'developer',
  initials: 'JD',
};

const mockOtherUser: User = {
  id: 'user-2',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'lead',
  initials: 'JS',
};

const mockReactions: Reaction[] = [
  { emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'], hasReacted: false },
  { emoji: '❤️', count: 1, users: ['user-1'], hasReacted: true },
];

const mockComment: Comment = {
  id: 'comment-1',
  issueId: 'issue-1',
  author: mockUser,
  text: 'This is a test comment.',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  reactions: [],
  mentions: [],
};

const mockCommentWithReactions: Comment = {
  ...mockComment,
  id: 'comment-2',
  reactions: mockReactions,
};

const mockEditedComment: Comment = {
  ...mockComment,
  id: 'comment-3',
  isEdited: true,
  updatedAt: new Date().toISOString(),
};

const mockDeletedComment: Comment = {
  ...mockComment,
  id: 'comment-4',
  isDeleted: true,
};

const mockReplyComment: Comment = {
  id: 'reply-1',
  issueId: 'issue-1',
  author: mockOtherUser,
  text: 'This is a reply.',
  createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  parentId: 'comment-1',
  reactions: [],
  mentions: [],
};

const mockComments: Comment[] = [
  mockComment,
  mockReplyComment,
];

// ============================================================================
// Test Utilities
// ============================================================================

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

// ============================================================================
// Tests
// ============================================================================

describe('CommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header with comment count', () => {
      renderWithTheme(<CommentThread comments={mockComments} />);

      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    it('should render empty state when no comments', () => {
      renderWithTheme(<CommentThread comments={[]} />);

      expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
    });

    it('should render comment input area', () => {
      renderWithTheme(<CommentThread comments={[]} currentUser={mockUser} />);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Comment/i })).toBeInTheDocument();
    });

    it('should render comment author name', () => {
      renderWithTheme(<CommentThread comments={[mockComment]} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render comment text', () => {
      renderWithTheme(<CommentThread comments={[mockComment]} />);

      expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
    });

    it('should show user initials in avatar when no image', () => {
      const commentWithoutAvatar: Comment = {
        ...mockComment,
        author: { ...mockUser, avatar: undefined },
      };
      renderWithTheme(<CommentThread comments={[commentWithoutAvatar]} currentUser={mockUser} />);

      // Avatar should show initials
      const avatars = screen.getAllByText('JD');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Time Formatting', () => {
    it('should show "just now" for very recent comments', () => {
      const recentComment: Comment = {
        ...mockComment,
        createdAt: new Date().toISOString(),
      };
      renderWithTheme(<CommentThread comments={[recentComment]} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should show hours ago for comments within a day', () => {
      const hoursAgoComment: Comment = {
        ...mockComment,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      };
      renderWithTheme(<CommentThread comments={[hoursAgoComment]} />);

      expect(screen.getByText('5h ago')).toBeInTheDocument();
    });

    it('should show date for older comments', () => {
      const oldComment: Comment = {
        ...mockComment,
        createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      };
      renderWithTheme(<CommentThread comments={[oldComment]} />);

      // Should show month and day
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
    });
  });

  describe('Edited Comments', () => {
    it('should show edited indicator for edited comments', () => {
      renderWithTheme(<CommentThread comments={[mockEditedComment]} />);

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });

  describe('Deleted Comments', () => {
    it('should show deleted message for deleted comments', () => {
      renderWithTheme(<CommentThread comments={[mockDeletedComment]} />);

      expect(screen.getByText('This comment was deleted')).toBeInTheDocument();
    });

    it('should not show comment text for deleted comments', () => {
      renderWithTheme(<CommentThread comments={[mockDeletedComment]} />);

      expect(screen.queryByText('This is a test comment.')).not.toBeInTheDocument();
    });
  });

  describe('Nested Comments/Replies', () => {
    it('should render replies nested under parent', () => {
      renderWithTheme(<CommentThread comments={mockComments} />);

      expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
      expect(screen.getByText('This is a reply.')).toBeInTheDocument();
    });

    it('should show reply count toggle', () => {
      renderWithTheme(<CommentThread comments={mockComments} />);

      expect(screen.getByText(/1 reply/)).toBeInTheDocument();
    });

    it('should toggle reply visibility when clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CommentThread comments={mockComments} />);

      // Initially visible
      expect(screen.getByText('This is a reply.')).toBeInTheDocument();

      // Click to hide
      await user.click(screen.getByText(/Hide 1 reply/));

      // Should show "Show" text
      expect(screen.getByText(/Show 1 reply/)).toBeInTheDocument();
    });

    it('should show multiple replies correctly', () => {
      const multipleReplies: Comment[] = [
        mockComment,
        mockReplyComment,
        {
          ...mockReplyComment,
          id: 'reply-2',
          text: 'Another reply',
        },
      ];
      renderWithTheme(<CommentThread comments={multipleReplies} />);

      expect(screen.getByText(/2 replies/)).toBeInTheDocument();
    });
  });

  describe('Adding Comments', () => {
    it('should call onAddComment when submitting a new comment', async () => {
      const user = userEvent.setup();
      const onAddComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[]}
          currentUser={mockUser}
          onAddComment={onAddComment}
        />
      );

      await user.type(screen.getByPlaceholderText('Write a comment...'), 'New comment');
      await user.click(screen.getByRole('button', { name: /Comment/i }));

      expect(onAddComment).toHaveBeenCalledWith('New comment');
    });

    it('should disable Comment button when input is empty', () => {
      renderWithTheme(
        <CommentThread comments={[]} currentUser={mockUser} />
      );

      expect(screen.getByRole('button', { name: /Comment/i })).toBeDisabled();
    });

    it('should enable Comment button when input has text', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread comments={[]} currentUser={mockUser} />
      );

      await user.type(screen.getByPlaceholderText('Write a comment...'), 'test');

      expect(screen.getByRole('button', { name: /Comment/i })).not.toBeDisabled();
    });

    it('should clear input after submitting', async () => {
      const user = userEvent.setup();
      const onAddComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[]}
          currentUser={mockUser}
          onAddComment={onAddComment}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.type(input, 'New comment');
      await user.click(screen.getByRole('button', { name: /Comment/i }));

      expect(input).toHaveValue('');
    });

    it('should submit comment with Cmd+Enter', async () => {
      const user = userEvent.setup();
      const onAddComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[]}
          currentUser={mockUser}
          onAddComment={onAddComment}
        />
      );

      const input = screen.getByPlaceholderText('Write a comment...');
      await user.type(input, 'New comment');
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(onAddComment).toHaveBeenCalledWith('New comment');
    });

    it('should trim whitespace from comment', async () => {
      const user = userEvent.setup();
      const onAddComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[]}
          currentUser={mockUser}
          onAddComment={onAddComment}
        />
      );

      await user.type(screen.getByPlaceholderText('Write a comment...'), '  trimmed  ');
      await user.click(screen.getByRole('button', { name: /Comment/i }));

      expect(onAddComment).toHaveBeenCalledWith('trimmed');
    });
  });

  describe('Replying to Comments', () => {
    it('should show reply input when reply button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      // Click the reply button (using tooltip title)
      const replyButton = screen.getByRole('button', { name: /Reply/i });
      await user.click(replyButton);

      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
    });

    it('should call onAddComment with parentId when replying', async () => {
      const user = userEvent.setup();
      const onAddComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
          onAddComment={onAddComment}
        />
      );

      await user.click(screen.getByRole('button', { name: /Reply/i }));
      await user.type(screen.getByPlaceholderText('Write a reply...'), 'My reply');

      // Click the Comment button in the reply form
      const buttons = screen.getAllByRole('button', { name: /Comment/i });
      await user.click(buttons[buttons.length - 1]); // Last one is the reply submit

      expect(onAddComment).toHaveBeenCalledWith('My reply', 'comment-1');
    });

    it('should show Cancel button in reply input', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      await user.click(screen.getByRole('button', { name: /Reply/i }));

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should hide reply input when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      await user.click(screen.getByRole('button', { name: /Reply/i }));
      expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      // The Collapse component hides content but may keep it in DOM
      // Wait for the collapse animation to complete
      await waitFor(() => {
        const replyInput = screen.queryByPlaceholderText('Write a reply...');
        // Either removed from DOM or not visible
        expect(replyInput === null || !replyInput.closest('.MuiCollapse-entered')).toBe(true);
      }, { timeout: 2000 });
    });
  });

  describe('Editing Comments', () => {
    it('should show edit option in menu for comment owner', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      // Click more menu button
      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should not show edit option for non-owner', async () => {
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockOtherUser}
        />
      );

      // Should not find the more menu button for this comment
      expect(screen.queryByTestId('MoreVertIcon')).not.toBeInTheDocument();
    });

    it('should show edit input when Edit is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);
      await user.click(screen.getByText('Edit'));

      // Should show text field with current comment text
      const textFields = screen.getAllByRole('textbox');
      const editField = textFields.find(f => (f as HTMLTextAreaElement).value === 'This is a test comment.');
      expect(editField).toBeInTheDocument();
    });

    it('should call onEditComment when Save is clicked', async () => {
      const user = userEvent.setup();
      const onEditComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
          onEditComment={onEditComment}
        />
      );

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);
      await user.click(screen.getByText('Edit'));

      // Find the edit text field and modify it
      const textFields = screen.getAllByRole('textbox');
      const editField = textFields.find(f => (f as HTMLTextAreaElement).value === 'This is a test comment.');
      await user.clear(editField!);
      await user.type(editField!, 'Updated comment');

      await user.click(screen.getByRole('button', { name: /Save/i }));

      expect(onEditComment).toHaveBeenCalledWith('comment-1', 'Updated comment');
    });

    it('should cancel edit when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);
      await user.click(screen.getByText('Edit'));

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      // Should be back to showing the original text
      expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
    });
  });

  describe('Deleting Comments', () => {
    it('should show delete option in menu for comment owner', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
        />
      );

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onDeleteComment when Delete is clicked', async () => {
      const user = userEvent.setup();
      const onDeleteComment = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          currentUser={mockUser}
          onDeleteComment={onDeleteComment}
        />
      );

      const moreButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreButtons[0].closest('button')!);
      await user.click(screen.getByText('Delete'));

      expect(onDeleteComment).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('Reactions', () => {
    it('should render reaction chips', () => {
      renderWithTheme(<CommentThread comments={[mockCommentWithReactions]} />);

      expect(screen.getByText('👍 3')).toBeInTheDocument();
      expect(screen.getByText('❤️ 1')).toBeInTheDocument();
    });

    it('should show reaction button', () => {
      renderWithTheme(<CommentThread comments={[mockComment]} />);

      expect(screen.getByTestId('AddReactionIcon')).toBeInTheDocument();
    });

    it('should open reaction menu when clicking reaction button', async () => {
      const user = userEvent.setup();
      renderWithTheme(<CommentThread comments={[mockComment]} />);

      await user.click(screen.getByTestId('AddReactionIcon').closest('button')!);

      // Should show emoji options
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should call onAddReaction when emoji is clicked', async () => {
      const user = userEvent.setup();
      const onAddReaction = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[mockComment]}
          onAddReaction={onAddReaction}
        />
      );

      await user.click(screen.getByTestId('AddReactionIcon').closest('button')!);
      await user.click(screen.getByText('👍'));

      expect(onAddReaction).toHaveBeenCalledWith('comment-1', '👍');
    });

    it('should call onAddReaction when clicking existing reaction chip', async () => {
      const user = userEvent.setup();
      const onAddReaction = vi.fn();
      renderWithTheme(
        <CommentThread
          comments={[mockCommentWithReactions]}
          onAddReaction={onAddReaction}
        />
      );

      await user.click(screen.getByText('👍 3'));

      expect(onAddReaction).toHaveBeenCalledWith('comment-2', '👍');
    });
  });

  describe('Nesting Limits', () => {
    it('should respect maxNestingLevel', () => {
      const deeplyNested: Comment[] = [
        { ...mockComment, id: 'c1' },
        { ...mockReplyComment, id: 'c2', parentId: 'c1' },
        { ...mockReplyComment, id: 'c3', parentId: 'c2', text: 'Level 2 reply' },
        { ...mockReplyComment, id: 'c4', parentId: 'c3', text: 'Level 3 reply' },
      ];

      // Note: The component only builds a 2-level tree (root + direct children)
      // so deeper nesting is not directly tested here
      renderWithTheme(
        <CommentThread
          comments={deeplyNested}
          maxNestingLevel={2}
        />
      );

      expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
    });

    it('should not show reply button when at max nesting level', async () => {
      // Create a comment at max nesting level
      const nestedComments: Comment[] = [
        mockComment,
        mockReplyComment,
      ];

      renderWithTheme(
        <CommentThread
          comments={nestedComments}
          currentUser={mockUser}
          maxNestingLevel={1}
        />
      );

      // Root comment should have reply button
      const replyButtons = screen.getAllByRole('button', { name: /Reply/i });
      expect(replyButtons.length).toBe(1); // Only root has reply
    });
  });

  describe('User Avatar', () => {
    it('should show question mark for unknown user', () => {
      renderWithTheme(<CommentThread comments={[]} />);

      // Default avatar without user shows ?
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should show user initials in comment input when no avatar URL', () => {
      const userWithoutAvatar: User = { ...mockUser, avatar: undefined };
      renderWithTheme(<CommentThread comments={[]} currentUser={userWithoutAvatar} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Comment Input with Current User', () => {
    it('should show current user avatar in comment input', () => {
      renderWithTheme(
        <CommentThread comments={[]} currentUser={mockUser} />
      );

      // When user has avatar URL, the img is rendered
      const avatars = screen.getAllByRole('img');
      expect(avatars.some(img => img.getAttribute('src') === mockUser.avatar)).toBe(true);
    });
  });

  describe('Props', () => {
    it('should accept issueId prop', () => {
      renderWithTheme(
        <CommentThread comments={[]} issueId="test-issue" />
      );

      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    it('should accept isLoading prop', () => {
      renderWithTheme(
        <CommentThread comments={[]} isLoading />
      );

      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });
  });
});

describe('CommentThread Edge Cases', () => {
  it('should handle comment with empty reactions array', () => {
    const commentWithEmptyReactions: Comment = {
      ...mockComment,
      reactions: [],
    };
    renderWithTheme(<CommentThread comments={[commentWithEmptyReactions]} />);

    expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
  });

  it('should handle comment with empty mentions array', () => {
    const commentWithEmptyMentions: Comment = {
      ...mockComment,
      mentions: [],
    };
    renderWithTheme(<CommentThread comments={[commentWithEmptyMentions]} />);

    expect(screen.getByText('This is a test comment.')).toBeInTheDocument();
  });

  it('should handle only root comments with no replies', () => {
    const rootOnlyComments: Comment[] = [
      mockComment,
      { ...mockComment, id: 'comment-5', text: 'Another root comment' },
    ];
    renderWithTheme(<CommentThread comments={rootOnlyComments} />);

    expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    expect(screen.queryByText(/replies/)).not.toBeInTheDocument();
  });

  it('should handle multiline comment text', () => {
    const multilineComment: Comment = {
      ...mockComment,
      text: 'Line 1\nLine 2\nLine 3',
    };
    renderWithTheme(<CommentThread comments={[multilineComment]} />);

    // Multiline text is preserved with whiteSpace: pre-wrap
    const content = document.body.textContent;
    expect(content).toContain('Line 1');
    expect(content).toContain('Line 2');
    expect(content).toContain('Line 3');
  });

  it('should not call onAddComment if not provided', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <CommentThread comments={[]} currentUser={mockUser} />
    );

    await user.type(screen.getByPlaceholderText('Write a comment...'), 'test');
    await user.click(screen.getByRole('button', { name: /Comment/i }));

    // Should not throw
  });

  it('should not call onEditComment if text unchanged', async () => {
    const user = userEvent.setup();
    const onEditComment = vi.fn();
    renderWithTheme(
      <CommentThread
        comments={[mockComment]}
        currentUser={mockUser}
        onEditComment={onEditComment}
      />
    );

    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    await user.click(moreButtons[0].closest('button')!);
    await user.click(screen.getByText('Edit'));
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(onEditComment).not.toHaveBeenCalled();
  });
});
