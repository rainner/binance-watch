/**
 * Emoji map for some common used icons
 */
export default function( name ) {
  switch ( name ) {
    case 'happy'     :  return '😀';
    case 'sad'       :  return '☹️';
    case 'angry'     :  return '😡';
    case 'shocked'   :  return '😱';
    case 'confused'  :  return '🤔';
    case 'sick'      :  return '🤒';
    case 'dead'      :  return '😵';
    case 'Lightning' :  return '⚡️';
    case 'gain'      :  return '📈';
    case 'loss'      :  return '📉';
    case 'bell'      :  return '🔔';
    case 'up'        :  return '▲';
    case 'down'      :  return '▼';
    case 'fire'      :  return '🔥';
    case 'rocket'    :  return '🚀';
    case 'moon'      :  return '🌕';
    case 'alert'     :  return '⚠️';
    case 'check'     :  return '✔️';
    case 'time'      :  return '⌛️';
    case 'clock'     :  return '⌚️';
    case 'money'     :  return '💰';
    case 'heart'     :  return '❤️';
    case 'comment'   :  return '💬';
    case 'note'      :  return '📝';
    case '100'       :  return '💯';
    case 'sos'       :  return '🆘';
    case 'denied'    :  return '🚫';
    default          :  return '';
  }
}
