# nodebb-plugin-chat-perms

Provides tighter control over chats in NodeBB with privacy warnings and keyword monitoring.

## Features

- **Chat Permission Control**: Restrict chat access based on reputation, post count, and group membership
- **Admin Chat Viewing**: Allow administrators to view any chat room
- **Privacy Warning Display**: Show configurable warnings to users that management can view chats
- **Keyword Alerts**: Monitor chat messages for sensitive keywords and notify administrators

## Installation

```bash
npm install nodebb-plugin-chat-perms
```

## Configuration

Configure the plugin via the `CHAT_PERMS_PLUGIN_SETTINGS` environment variable as a JSON string:

```bash
export CHAT_PERMS_PLUGIN_SETTINGS='{"ADMIN_UIDS":[1,2],"WARNING_ENABLED":true}'
```

### Basic Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ADMIN_UIDS` | `number[]` | `[1]` | User IDs with admin access to view all chats |
| `ALLOW_CHAT_GROUP` | `string` | `"allowChat"` | Group name that bypasses chat restrictions |
| `DENY_CHAT_GROUP` | `string` | `"denyChat"` | Group name that denies chat access |
| `MIN_REPUTATION` | `number` | `10` | Minimum reputation required to chat |
| `MIN_POSTS` | `number` | `5` | Minimum posts required to chat |
| `CHAT_NOT_YET_ALLOWED_MESSAGE` | `string` | `"CHAT_NOT_YET_ALLOWED_MESSAGE"` | Message shown when user doesn't meet requirements |
| `CHAT_DENIED_MESSAGE` | `string` | `"CHAT_DENIED_MESSAGE"` | Message shown when user is in deny group |

### Privacy Warning Settings

Display a warning message to users that administrators can view their chat messages.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `WARNING_ENABLED` | `boolean` | `false` | Enable/disable the privacy warning |
| `WARNING_MESSAGE` | `string` | Hebrew default | Custom warning message text |
| `WARNING_DISPLAY_TYPE` | `string` | `"banner"` | Display format: `"banner"`, `"popup"`, or `"inline"` |

#### Example: Enable Privacy Warning

```json
{
  "WARNING_ENABLED": true,
  "WARNING_MESSAGE": "Notice: Chat messages may be viewed by site administrators",
  "WARNING_DISPLAY_TYPE": "banner"
}
```

### Keyword Alert Settings

Monitor chat messages for specific keywords and send notifications to administrators.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `KEYWORD_ALERTS_ENABLED` | `boolean` | `false` | Enable/disable keyword scanning |
| `KEYWORD_LIST` | `string[]` | `[]` | List of keywords to monitor (case-insensitive) |
| `ALERT_RECIPIENT_UIDS` | `number[]` | `[]` | User IDs to receive keyword alerts |

#### Example: Enable Keyword Alerts

```json
{
  "KEYWORD_ALERTS_ENABLED": true,
  "KEYWORD_LIST": ["spam", "abuse", "inappropriate"],
  "ALERT_RECIPIENT_UIDS": [1, 2]
}
```

When a keyword is detected, administrators receive a notification containing:
- Message content
- Sender username
- Chat room identifier
- Timestamp
- All matched keywords

## Full Configuration Example

```json
{
  "ADMIN_UIDS": [1, 2],
  "ALLOW_CHAT_GROUP": "trustedUsers",
  "DENY_CHAT_GROUP": "bannedFromChat",
  "MIN_REPUTATION": 20,
  "MIN_POSTS": 10,
  "CHAT_NOT_YET_ALLOWED_MESSAGE": "You need more reputation to use chat",
  "CHAT_DENIED_MESSAGE": "Your chat access has been revoked",
  "WARNING_ENABLED": true,
  "WARNING_MESSAGE": "Chat messages may be monitored by staff",
  "WARNING_DISPLAY_TYPE": "banner",
  "KEYWORD_ALERTS_ENABLED": true,
  "KEYWORD_LIST": ["spam", "scam", "abuse"],
  "ALERT_RECIPIENT_UIDS": [1]
}
```

## Compatibility

This plugin is compatible with NodeBB version 3.x. The plugin automatically checks compatibility on load and logs a warning if running on an unsupported version.

## License

MIT
