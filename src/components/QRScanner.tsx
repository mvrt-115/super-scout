import React, { Component } from 'react'
import jsQR from 'jsqr'

const { requestAnimationFrame } = global

class QRScanner extends Component<{onFind: (data: string) => void},{notEnabled: boolean, loading: boolean, video: HTMLVideoElement|null}> {
  constructor (props: any) {
    super(props)
    this.state = {
      notEnabled: true,
      loading: true,
      video: null,
    }
  }

  componentDidMount () {
    const video = document.createElement('video')
    const canvasElement = document.getElementById('qrCanvas') as HTMLCanvasElement;
    const canvas = (canvasElement!).getContext('2d')

    this.setState({ video })

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then( (stream) => {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        video.play()
        requestAnimationFrame(tick);
    })

    const tick = () => {
        if (this.state.notEnabled) this.setState({ notEnabled: false })
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            if (this.state.loading) this.setState({ loading: false })
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            (canvas!).drawImage(video, 0, 0, canvasElement.width, canvasElement.height)
            var imageData = (canvas!).getImageData(0, 0, canvasElement.width, canvasElement.height)
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            })
            if (this.state.video?.srcObject && code) {
                this.props.onFind(code.data);
                return;
            }
        }
        requestAnimationFrame(tick);
    }
  }

  componentWillUnmount () {
    (this.state.video!).pause();
    //Kills the video stream before the component unmounts so it will not stay running - massive battery drain
    if(this.state.video?.srcObject)
        (this.state.video?.srcObject! as MediaStream).getTracks().forEach(track => track.stop());
  }

  render () {
    let message
    if (this.state.notEnabled) {
      message = <div><span role='img' aria-label='camera'>🎥</span> Unable to access video stream (please make sure you have a webcam enabled)</div>
    } else if (this.state.loading) {
      message = <div><span role='img' aria-label='time'>⌛</span> Loading video...</div>
    }

    return (
      <div>
        { message }
        <canvas id='qrCanvas' />
      </div>
    )
  }
}

export default QRScanner
