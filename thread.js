
import { createApp, createGroupChannel, createUser } from './api.js';

import SendbirdChat from './sdk/index.js';
import { GroupChannelHandler, GroupChannelModule } from './sdk/groupChannel.js';

const env = {
  apiHost: 'https://api-no2.sendbirdtest.com',
  wsHost: 'wss://ws-no2.sendbirdtest.com',
};
const sampleCacheKey = 'sample/thread';

const system = (text) => {
  const $message = document.querySelector('.message');
  $message.innerHTML = text;
};
const setup = async () => {
  let sessionInfo = localStorage.getItem(sampleCacheKey);
  if (!sessionInfo) {
    system('Creating an app...');
    const { appId, apiToken } = await createApp({ host: env.apiHost });

    system('Creating users...');
    const john = await createUser({
      host: env.apiHost,
      apiToken,
      userId: 'john',
    });
    const dave = await createUser({
      host: env.apiHost,
      apiToken,
      userId: 'brandon',
    });

    system('Creating a group channel...');
    const channelUrl = await createGroupChannel({
      host: env.apiHost,
      apiToken,
      userId: john.userId,
      invitedUserIds: [dave.userId],
    });

    sessionInfo = JSON.stringify({
      appId,
      apiToken,
      userIds: [john.userId, dave.userId],
      channelUrl,
    });
    localStorage.setItem(sampleCacheKey, sessionInfo);
  }
  system('Test environment is ready.');
  return JSON.parse(sessionInfo);
};
const simulate = async ({ appId, userId, channelUrl }) => {
  const $simulators = document.querySelector('.simulators');
  const $simulator = document.createElement('div');
  $simulator.innerHTML = `
    <div class="user">
      <div class='user-id'>${userId}</div>
      <div class='user-message'></div>
    </div>
    <div class="channel">
      <div class="label">Total unread reply count</div>
      <div class="total-unread-reply-count"></div>
    </div>
    <div class="chat">
      <div class="chat-pannel all-messages">
        <div class="title">All Messages</div>
        <div class="list"></div>
      </div>
      <div class="chat-pannel reply-messages">
        <div class="title">Reply Messages</div>
        <div class="list"></div>
      </div>
      <div class="chat-pannel parent-messages">
        <div class="title">Threaded Parent Messages</div>
        <div class="list"></div>
      </div>
    </div>
    <div class="control">
      <div class="button send-text-message">
        <i class="icon fa-regular fa-comment"></i>
        Send
      </div>
      <div class="button send-file-message">
        <i class="icon fa-solid fa-cloud-arrow-up"></i>
        Send
      </div>
      <div class="pad"></div>
      <div class="button send-text-reply">
        <i class="icon fa-solid fa-reply"></i>
        Reply
      </div>
      <div class="button send-file-reply">
        <i class="icon fa-solid fa-cloud-arrow-up"></i>
        Reply
      </div>
      <div class="button mark-as-read">
        <i class="icon fa-solid fa-check"></i>
        Mark As Read
      </div>
      <div class="button push-enabled">
        <i class="icon fa-solid fa-bell"></i>
        Toggle Push Notification
      </div>
    </div>
  `;
  $simulator.className = 'simulator';
  $simulators.appendChild($simulator);

  const $allMessages = $simulator.querySelector('.chat .all-messages .list');
  $allMessages.addEventListener('scroll', async () => {
    if($allMessages.scrollTop === $allMessages.scrollHeight - $allMessages.offsetHeight) {
      const messages = await allMessagesQuery.load();
      appendAllMessages(messages);
    }
  });
  
  const $replyMessages = $simulator.querySelector('.chat .reply-messages .list');
  $replyMessages.addEventListener('scroll', async () => {
    if($replyMessages.scrollTop === $replyMessages.scrollHeight - $replyMessages.offsetHeight) {
      if (selectedMessage) {
        const ts = replyMessages.length > 0 ? replyMessages[replyMessages.length - 1].createdAt : Date.now();
        selectedMessage.getThreadedMessagesByTimestamp(ts, { nextResultSize: 100 })
          .then(({ threadedMessages }) => {
            appendReplyMessages(threadedMessages);
          });
      }
    }
  });

  const $parentMessages = $simulator.querySelector('.chat .parent-messages .list');
  $parentMessages.addEventListener('scroll', async () => {
    if($parentMessages.scrollTop === $parentMessages.scrollHeight - $parentMessages.offsetHeight) {
      const messages = await parentMessagesQuery.load();
      appendParentMessages(messages);
    }
  });
  
  const allMessages = [];
  const parentMessages = [];
  
  let replyMessages = [];
  let selectedMessage = null;
  let $selectedMessage = null;

  const generateMessageInnerHtml = (message) => {
    if (message.isUserMessage()) {
      return `
        <i class="icon fa-regular fa-comment"></i>
        <div class='content'>${message.sender.userId}: ${message.message}</div>
        ${message.threadInfo && message.threadInfo.replyCount > 0 ? `<div class='count'>
          <i class="icon fa-solid fa-reply"></i>
          <div class='reply-count'>${message.threadInfo.replyCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.memberCount > 0 ? `<div class='count'>
          <i class="icon fa-solid fa-people-group"></i>
          <div class='member-count'>${message.threadInfo.memberCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.unreadReplyCount > 0 ? `<div class='count'>
          <i class="icon fa-regular fa-envelope"></i>
          <div class='unread-reply-count'>${message.threadInfo.unreadReplyCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.isPushNotificationEnabled === false ? `<div class='count'>
          <i class="icon fa-solid fa-bell-slash"></i>
        </div>` : ''}
      `;
    } else if (message.isFileMessage()) {
      return `
        <i class="icon fa-regular fa-file"></i>
        <div class='content'>${message.sender.userId}: attachment ${message.messageId}</div>
        ${message.threadInfo && message.threadInfo.replyCount > 0 ? `<div class='count'>
          <i class="icon fa-solid fa-reply"></i>
          <div class='reply-count'>${message.threadInfo.replyCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.memberCount > 0 ? `<div class='count'>
          <i class="icon fa-solid fa-people-group"></i>
          <div class='member-count'>${message.threadInfo.memberCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.unreadReplyCount > 0 ? `<div class='count'>
          <i class="icon fa-regular fa-envelope"></i>
          <div class='unread-reply-count'>${message.threadInfo.unreadReplyCount}</div>
        </div>` : ''}
        ${message.threadInfo && message.threadInfo.isPushNotificationEnabled === false ? `<div class='count'>
          <i class="icon fa-solid fa-bell-slash"></i>
        </div>` : ''}
      `;
    }
  };
  const createMessageElement = (message, tag) => {
    const $message = document.createElement('div');
    $message.className = `chat-message ${tag}-message-${message.messageId}`;
    $message.innerHTML = generateMessageInnerHtml(message);
    return $message;
  };
  const appendAllMessages = (messages) => {
    allMessages.push(...messages);
    messages.forEach((message) => {
      const $message = createMessageElement(message, 'all');
      $message.addEventListener('click', () => {
        selectMessage(message);
      });
      $allMessages.appendChild($message);
    });
  };
  const appendReplyMessages = (messages) => {
    const repliesOfSelectedMessage = messages.filter((message) => message.parentMessageId === selectedMessage.messageId);
    if (repliesOfSelectedMessage.length > 0) {
      replyMessages.push(...repliesOfSelectedMessage);
      repliesOfSelectedMessage.forEach((message) => {
        const $message = createMessageElement(message, 'reply');

        if (message.sender?.userId === sdk.currentUser?.userId) {
          const $deleteMessage = document.createElement('div');
          $deleteMessage.className = 'delete';
          $deleteMessage.innerHTML = '<i class="fa-solid fa-trash"></i>';
          $deleteMessage.addEventListener('click', async () => {
            await channel.deleteMessage(message);
            $replyMessages.removeChild($message);
          });
          $message.appendChild($deleteMessage);
        }
        $replyMessages.appendChild($message);
      });
    }
  };
  const appendParentMessages = (messages) => {
    parentMessages.push(...messages);
    messages.forEach((message) => {
      const $message = createMessageElement(message, 'parent');
      $message.addEventListener('click', () => {
        console.log(message.threadInfo);
      });
      $parentMessages.appendChild($message);
    });
  };
  const prependParentMessage = (message) => {
    parentMessages.unshift(message);
    const $message = createMessageElement(message, 'parent');
    $parentMessages.insertBefore($message, $parentMessages.childNodes[0]);
  };
  const removeParentMessage = (message) => {
    const index = parentMessages.map(m => m.messageId).indexOf(message.messageId);
    if (index >= 0) {
      parentMessages.splice(index, 1);
      $parentMessages.removeChild($parentMessages.childNodes[index]);
    }
  };
  const selectMessage = (message) => {
    if ($selectedMessage) {
      $selectedMessage.className = `chat-message all-message-${selectedMessage.messageId}`;
    }
    selectedMessage = message;
    $selectedMessage = $simulator.querySelector(`.all-message-${message.messageId}`);
    $selectedMessage.className = `chat-message all-message-${message.messageId} selected`;

    $replyMessages.innerHTML = '';
    selectedMessage.getThreadedMessagesByTimestamp(Date.now(), { prevResultSize: 100 })
      .then(({ threadedMessages }) => {
        appendReplyMessages(threadedMessages);
      });
  };
  const updateThreadInfo = (event) => {
    for (const message of allMessages) {
      if (message.messageId === event.targetMessageId) {
        if (message.applyThreadInfoUpdateEvent(event)) {
          const $message = $simulator.querySelector(`.all-message-${message.messageId}`);
          $message.innerHTML = generateMessageInnerHtml(message);
        }
        break;
      }
    }
    for (const message of parentMessages) {
      if (message.messageId === event.targetMessageId) {
        if (message.applyThreadInfoUpdateEvent(event)) {
          const $message = $simulator.querySelector(`.parent-message-${message.messageId}`);
          $message.innerHTML = generateMessageInnerHtml(message);

          if (selectedMessage) {
            const index = parentMessages.map(m => m.messageId).indexOf(selectedMessage.messageId);
            if (index >= 0) {
              removeParentMessage(parentMessages[index]);
            }
            prependParentMessage(selectedMessage);
          }
        }
        break;
      }
    }
  };
  
  const $message = $simulator.querySelector('.user .user-message');
  const message = (text) => {
    $message.innerHTML = text;
  };
  const updateTotalUnreadReplyCount = (channel) => {
    const $count = $simulator.querySelector('.channel .total-unread-reply-count');
    $count.innerHTML = channel.totalUnreadReplyCount < 100 ?
      channel.totalUnreadReplyCount :
      '99+';
  };

  const sdk = SendbirdChat.init({
    appId,
    customApiHost: env.apiHost,
    customWebSocketHost: env.wsHost,
    modules: [
      new GroupChannelModule(),
    ],
    localCacheEnabled: false,
    newInstance: true,
  });
  sdk.groupChannel.addGroupChannelHandler('handlerKey', new GroupChannelHandler({
    onMessageReceived: (channel, message) => {
      if (message.parentMessageId > 0) {
        if (selectedMessage && selectedMessage.messageId === message.parentMessageId) {
          appendReplyMessages([message]);
        }
        updateTotalUnreadReplyCount(channel);
      } else {
        appendAllMessages([message]);
      }
    },
    onChannelChanged: (channel) => {
      updateTotalUnreadReplyCount(channel);
    },
    onThreadInfoUpdated: (channel, event) => {
      updateTotalUnreadReplyCount(channel);
      updateThreadInfo(event);
    },
  }));

  message('Connecting...');
  await sdk.connect(userId);
  message('Connected');

  const channel = await sdk.groupChannel.getChannel(channelUrl);
  updateTotalUnreadReplyCount(channel);

  // all messages
  const allMessagesQuery = channel.createPreviousMessageListQuery({
    includeThreadInfo: true,
  });
  appendAllMessages(await allMessagesQuery.load());

  // threaded parent messages
  const parentMessagesQuery = channel.createThreadedParentMessageListQuery();
  appendParentMessages(await parentMessagesQuery.load());

  // control
  const $sendTextMessage = $simulator.querySelector('.control .send-text-message');
  $sendTextMessage.addEventListener('click', () => {
    channel.sendUserMessage({ message: `message ${Math.floor(Math.random() * 1000000)}` })
      .onSucceeded((message) => {
        appendAllMessages([message]);
      });
  });

  const $sendFileMessage = $simulator.querySelector('.control .send-file-message');
  $sendFileMessage.addEventListener('click', () => {
    channel.sendFileMessage({ fileUrl: `file/${Math.floor(Math.random() * 1000000)}` })
      .onSucceeded((message) => {
        appendAllMessages([message]);
      });
  });

  const $replyTextMessage = $simulator.querySelector('.control .send-text-reply');
  $replyTextMessage.addEventListener('click', () => {
    if (selectedMessage) {
      channel.sendUserMessage({
        message: `reply ${Math.floor(Math.random() * 1000000)}`,
        parentMessageId: selectedMessage.messageId,
      })
      .onSucceeded((message) => {
        appendReplyMessages([message]);
        if (selectedMessage) {
          const index = parentMessages.map(m => m.messageId).indexOf(selectedMessage.messageId);
          if (index >= 0) {
            removeParentMessage(parentMessages[index]);
          }
          prependParentMessage(selectedMessage);
        }
      });
    }
  });

  const $replyFileMessage = $simulator.querySelector('.control .send-file-reply');
  $replyFileMessage.addEventListener('click', () => {
    if (selectedMessage) {
      channel.sendFileMessage({
        fileUrl: `file/${Math.floor(Math.random() * 1000000)}`,
        parentMessageId: selectedMessage.messageId,
      })
      .onSucceeded((message) => {
        appendReplyMessages([message]);
        if (selectedMessage) {
          const index = parentMessages.map(m => m.messageId).indexOf(selectedMessage.messageId);
          if (index >= 0) {
            removeParentMessage(parentMessages[index]);
          }
          prependParentMessage(selectedMessage);
        }
      });
    }
  });

  const $markAsRead = $simulator.querySelector('.control .mark-as-read');
  $markAsRead.addEventListener('click', () => {
    if (selectedMessage) {
      selectedMessage.markThreadAsRead()
        .then(() => {
          updateTotalUnreadReplyCount(channel);
        });
    }
  });

  const $togglePushEnabled = $simulator.querySelector('.control .push-enabled');
  $togglePushEnabled.addEventListener('click', () => {
    if (selectedMessage && selectedMessage.threadInfo) {
      const isCurrentlyEnabled = selectedMessage.threadInfo.isPushNotificationEnabled ?? true;
      selectedMessage.setPushNotificationEnabled(!isCurrentlyEnabled);
    }
  });
};

window.onload = async () => {
  const { appId, apiToken, userIds, channelUrl } = await setup();
  for (const userId of userIds) {
    simulate({ appId, apiToken, userId, channelUrl });
  }
};