export class ScrollManager {
    constructor(topBar, barBg, nickname, message) {
        this.topBar = topBar;
        this.barBg = barBg;
        this.nickname = nickname;
        this.message = message;
        this.overscroll = 60;
        this.maxOverscroll = 60;

        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        window.addEventListener('scroll', this.handleScroll.bind(this));
        this.updateVisuals();
    }


    handleWheel(e) {
        if (window.scrollY === 0 && e.deltaY < 0) {
            e.preventDefault();
            this.overscroll = Math.min(this.maxOverscroll, this.overscroll + (-e.deltaY));
            this.updateVisuals();
        } else if (this.overscroll > 0) {
            this.resetEffect();
        }
    }

    handleScroll() {
        if (window.scrollY > 0 && this.overscroll > 0) {
            this.resetEffect();
        }
    }

    updateVisuals() {
        this.topBar.style.transform = `translateY(${this.overscroll}px)`;
        this.message.style.transform = `translate(-50%, ${this.overscroll}px)`;
        this.barBg.style.height = `${this.overscroll}px`;
        this.barBg.style.opacity = this.overscroll / this.maxOverscroll;
        this.nickname.style.boxShadow = `0 ${-this.overscroll/2}px ${this.overscroll}px ${this.overscroll/3}px rgba(128,0,128,${(this.overscroll/this.maxOverscroll)*0.7})`;
    }

    resetEffect() {
        this.overscroll = 0;
        this.topBar.style.transition = 'transform 0.5s ease';
        this.message.style.transition = 'transform 0.5s ease';
        this.barBg.style.transition = 'height 0.5s ease, opacity 0.5s ease';
        this.nickname.style.transition = 'box-shadow 0.5s ease, background 0.5s ease';

        this.updateVisuals();
        setTimeout(() => {
            this.topBar.style.transition = 'transform 0.3s ease';
            this.message.style.transition = 'transform 0.3s ease';
            this.barBg.style.transition = 'height 0.4s ease, opacity 0.4s ease';
            this.nickname.style.transition = 'box-shadow 0.3s ease, background 0.3s ease';
        }, 500);
    }
}