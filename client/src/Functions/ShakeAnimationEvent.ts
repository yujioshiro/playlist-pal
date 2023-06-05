import './ShakeAnimationEvents.css'

export function ShakeAnimation(element: HTMLElement) {
    element.classList.add('shake')
    setTimeout(function(){
        element.classList.remove('shake')
    },199)
}