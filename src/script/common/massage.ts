import { createApp } from 'vue';
import Massage from '../../components/common/Massage.vue';


export default function (info: string, type: string, duration: number = 3000) {
    const app = createApp(Massage);

    const div = document.createElement('div');
    const msg = app.mount(div);
    msg.$.exposed!.showMessage(info, type, duration);

    document.body.appendChild(div)

    setTimeout(() => {
        app.unmount()
        div.remove()
    }, duration)
};