
export class Component {
    mounted = false;

    mount() {
        this.mounted = true;
    }

    unmount() {
        this.mounted = false;
    }
}