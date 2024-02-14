import { API_TOKEN, SECRET_API_TOKEN } from './secret.js';

const DEFAULT_SESSION_TOKEN_PERIOD = 15 * 60 * 1000;
const SAMPLE_PROFILE_URL = 'https://static.sendbird.com/sample/profiles/profile_21_512px.png';

export const createApp = async ({ host }) => {
  const endpoint = `${host}/v3/applications`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': API_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      name: 'JavaScript private sample app',
    }),
  });
  const app = await response.json();

  await fetch(`${host}/v3/secret/${app['app_id']}/plan`, {
    method: 'POST',
    headers: {
      'Secret-Key': SECRET_API_TOKEN,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      plan: 'enterprise',
      plan_premiums: ['poll'],
    }),
  });
  await fetch(`${host}/v3/secret/${app['app_id']}/attrs`, {
    method: 'PUT',
    headers: {
      'Secret-Key': SECRET_API_TOKEN,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      pinned_messages: {
        pin_limit: 3,
        remove_on_limit: false,
      },
      acl: {
        allow_sdk_request_log_publish: true,
        allow_sdk_feature_local_cache_log_publish: true,
      },
      use_ws_compression: false,
      enable_unread_count_for_replies: true,
    }),
  });
  return {
    appId: app['app_id'],
    apiToken: app['api_token'],
    createdAt: Date.now(),
  };
};

export const createUser = async ({ host, apiToken, userId, profileUrl = SAMPLE_PROFILE_URL }) => {
  const endpoint = `${host}/v3/users`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Api-Token': apiToken,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      user_id: userId,
      nickname: userId,
      profile_url: profileUrl,
    }),
  });
  const user = await response.json();
  return {
    userId: user['user_id'],
  };
};

export const issueSessionToken = async ({ host, apiToken, userId, period = DEFAULT_SESSION_TOKEN_PERIOD }) => {
  const endpoint = `${host}/v3/users/${userId}/token`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Api-Token': apiToken,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      expires_at: Date.now() + period,
    }),
  });
  const result = await response.json();
  return result.token;
};

export const createGroupChannel = async ({
  host,
  apiToken,
  userId,
  name = 'Sample channel',
  isPublic = false,
  isSuper = false,
  invitedUserIds = [],
}) => {
  const endpoint = `${host}/v3/group_channels`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Api-Token': apiToken,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      user_ids: [ ...invitedUserIds, userId ],
      operator_ids: [ userId ],
      inviter_id: userId,
      name,
      is_public: isPublic,
      is_super: isSuper,
    }),
  });
  const result = await response.json();
  return result['channel_url'];
};