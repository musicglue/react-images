import React, { Component, PropTypes } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import Swipeable from 'react-swipeable';
import {Motion, spring} from 'react-motion';

import theme from './theme';
import Arrow from './components/Arrow';
import Container from './components/Container';
import Footer from './components/Footer';
import Header from './components/Header';
import PaginatedThumbnails from './components/PaginatedThumbnails';
import Portal from './components/Portal';
import ScrollLock from './components/ScrollLock';

import { bindFunctions, canUseDom } from './utils';

class Lightbox extends Component {
	constructor () {
		super();

		this.state = {
			isSwipingLeft: false,
			isSwipingRight: false,
			swipeDeltaX: 0
		}

		bindFunctions.call(this, [
			'gotoNext',
			'gotoPrev',
			'onSwipingLeft',
			'onSwipingRight',
			'onStopSwiping',
			'onMotionRest',
			'handleKeyboardInput',
		]);
	}
	getChildContext () {
		return {
			theme: this.props.theme,
		};
	}
	componentWillReceiveProps (nextProps) {
		if (!canUseDom) return;

		// preload images
		if (nextProps.preloadNextImage) {
			const currentIndex = this.props.currentImage;
			const nextIndex = nextProps.currentImage + 1;
			const prevIndex = nextProps.currentImage - 1;
			let preloadIndex;

			if (currentIndex && nextProps.currentImage > currentIndex) {
				preloadIndex = nextIndex;
			} else if (currentIndex && nextProps.currentImage < currentIndex) {
				preloadIndex = prevIndex;
			}

			// if we know the user's direction just get one image
			// otherwise, to be safe, we need to grab one in each direction
			if (preloadIndex) {
				this.preloadImage(preloadIndex);
			} else {
				this.preloadImage(prevIndex);
				this.preloadImage(nextIndex);
			}
		}

		// add event listeners
		if (nextProps.enableKeyboardInput) {
			window.addEventListener('keydown', this.handleKeyboardInput);
		} else {
			window.removeEventListener('keydown', this.handleKeyboardInput);
		}
	}
	componentWillUnmount () {
		if (this.props.enableKeyboardInput) {
			window.removeEventListener('keydown', this.handleKeyboardInput);
		}
	}

	// ==============================
	// METHODS
	// ==============================

	preloadImage (idx) {
		const image = this.props.images[idx];

		if (!image) return;

		const img = new Image();

		img.src = image.src;

		if (image.srcset) {
			img.srcset = image.srcset.join();
		}
	}
	gotoNext (event) {
		if (this.isLastImage()) return;
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.resetSwipe(this.props.onClickNext);

	}
	gotoPrev (event) {
		if (this.isFirstImage()) return;
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.resetSwipe(this.props.onClickPrev);

	}
	handleKeyboardInput (event) {
		if (event.keyCode === 37) {
			this.gotoPrev(event);
			return true;
		} else if (event.keyCode === 39) {
			this.gotoNext(event);
			return true;
		} else if (event.keyCode === 27) {
			this.props.onClose();
			return true;
		}
		return false;

	}
	onSwipingLeft (e, deltaX) {
		if (this.isLastImage()) return;
		this.setState({
			isSwipingLeft: true,
			isSwipingRight: false,
			swipeDeltaX: deltaX
		})
	}
	onSwipingRight (e, deltaX) {
		if (this.isFirstImage()) return;
		this.setState({
			isSwipingLeft: false,
			isSwipingRight: true,
			swipeDeltaX: deltaX
		})
	}
	onStopSwiping () {
		let windowWidth = window.innerWidth;
		this.setState({
			swipeDeltaX: windowWidth
		})
	}
	onMotionRest () {
		const wasSwipingLeft = this.state.isSwipingLeft;
		const wasSwipingRight = this.state.isSwipingRight;
		this.setState({
			isSwipingLeft: false,
			isSwipingRight: false
		}, () => {
			const fakeEvent = {
				preventDefault: () => {},
				stopPropagation: () => {}
			}

			if (wasSwipingLeft) {
				this.gotoNext(fakeEvent)
			}
			else if (wasSwipingRight) {
				this.gotoPrev(fakeEvent)
			}
		})
	}
	isFirstImage() {
		return this.props.currentImage === 0;
	}
	isLastImage () {
		return this.props.currentImage === (this.props.images.length - 1);
	}
	resetSwipe(onReset) {
		this.setState({
			isSwipingLeft: false,
			isSwipingRight: false,
			swipeDeltaX: 0
		}, () => { onReset ? onReset() : null })
	}

	// ==============================
	// RENDERERS
	// ==============================

	renderArrowPrev () {
		if (this.props.currentImage === 0) return null;

		return (
			<Arrow
				direction="left"
				icon="arrowLeft"
				onClick={this.gotoPrev}
				title="Previous (Left arrow key)"
				type="button"
			/>
		);
	}
	renderArrowNext () {
		if (this.props.currentImage === (this.props.images.length - 1)) return null;

		return (
			<Arrow
				direction="right"
				icon="arrowRight"
				onClick={this.gotoNext}
				title="Previous (Right arrow key)"
				type="button"
			/>
		);
	}
	renderDialog () {
		const {
			backdropClosesModal,
			customControls,
			isOpen,
			onClose,
			showCloseButton,
			showThumbnails,
			width,
		} = this.props;

		if (!isOpen) return <span key="closed" />;

		let offsetThumbnails = 0;
		if (showThumbnails) {
			offsetThumbnails = theme.thumbnail.size + theme.container.gutter.vertical;
		}

		return (
			<Container
				key="open"
				onClick={!!backdropClosesModal && onClose}
				onTouchEnd={!!backdropClosesModal && onClose}
			>
				<div className={css(classes.content)} style={{ marginBottom: offsetThumbnails, maxWidth: width }}>
					<Header
						customControls={customControls}
						onClose={onClose}
						showCloseButton={showCloseButton}
					/>
					{this.renderImages()}
				</div>
				{this.renderThumbnails()}
				{this.renderArrowPrev()}
				{this.renderArrowNext()}
				<ScrollLock />
			</Container>
		);
	}
	renderImages () {
		const {
			currentImage,
			images,
			imageCountSeparator,
			onClickImage,
			showImageCount,
			showThumbnails,
		} = this.props;

		if (!images || !images.length) return null;

		const image = images[currentImage];

		let imageLeft;
		let imageRight;
		let deltaX;
		let motionStyle = { deltaX: 0 };
		if (this.state.isSwipingRight) {
			imageLeft = images[currentImage - 1];
			motionStyle = { deltaX: spring(this.state.swipeDeltaX) };
		}
		else if (this.state.isSwipingLeft) {
			imageRight = images[currentImage + 1];
			motionStyle = { deltaX: spring(-this.state.swipeDeltaX) };
		}

		let srcset;
		let sizes;

		if (image.srcset) {
			srcset = image.srcset.join();
			sizes = '100vw';
		}

		const thumbnailsSize = showThumbnails ? theme.thumbnail.size : 0;
		const heightOffset = `${theme.header.height + theme.footer.height + thumbnailsSize + (theme.container.gutter.vertical)}px`;

		return (
			<figure className={css(classes.figure)}>
				<Swipeable
					onSwipedLeft={this.onStopSwiping}
					onSwipedRight={this.onStopSwiping}
					onSwipingLeft={this.onSwipingLeft}
					onSwipingRight={this.onSwipingRight}
				>

					<Motion
						style={motionStyle}
						onRest={this.onMotionRest}
					>
						{({deltaX}) => (
              <div>
                {
                  imageLeft ?
                    <div
                      key={currentImage - 1}
                      className={css(classes.imageContainer)}
                      style={{ marginLeft: -window.innerWidth + deltaX }}
                    >
                      <img
                        className={css(classes.image)}
                        sizes={sizes}
                        src={imageLeft.src}
                        srcSet={imageLeft.srcset.join()}
                        style={{
                          cursor: this.props.onClickImage ? 'pointer' : 'auto',
                          maxHeight: `calc(100vh - ${heightOffset})`,
                        }}
                      />

                      <Footer
                        caption={images[currentImage - 1].caption}
                        countCurrent={currentImage}
                        countSeparator={imageCountSeparator}
                        countTotal={images.length}
                        showCount={showImageCount}
                      />
                    </div>
                    :
                    null
                }
                <div
                  key={currentImage}
                  className={css(classes.imageContainer)}
                  style={{ marginLeft: deltaX }}
                >
                  <img
                    className={css(classes.image)}
                    onClick={!!onClickImage && onClickImage}
                    sizes={sizes}
                    src={image.src}
                    srcSet={srcset}
                    style={{
                      cursor: this.props.onClickImage ? 'pointer' : 'auto',
                      maxHeight: `calc(100vh - ${heightOffset})`,
                    }}
                  />
                  <Footer
                    caption={images[currentImage].caption}
                    countCurrent={currentImage + 1}
                    countSeparator={imageCountSeparator}
                    countTotal={images.length}
                    showCount={showImageCount}
                  />
                </div>
                {
                  imageRight ?
                    <div
                      key={currentImage + 1}
                      className={css(classes.imageContainer)}
                      style={{ marginLeft: window.innerWidth + deltaX }}
                    >
                      <img
                        className={css(classes.image)}
                        sizes={sizes}
                        src={imageRight.src}
                        srcSet={imageRight.srcset.join()}
                        style={{
                          cursor: this.props.onClickImage ? 'pointer' : 'auto',
                          maxHeight: `calc(100vh - ${heightOffset})`,
                        }}
                      />
                      <Footer
                        caption={images[currentImage + 1].caption}
                        countCurrent={currentImage + 2}
                        countSeparator={imageCountSeparator}
                        countTotal={images.length}
                        showCount={showImageCount}
                      />
                    </div>
                    :
                    null
                }
              </div>
						)}
					</Motion>
				</Swipeable>
			</figure>
		);
	}
	renderThumbnails () {
		const { images, currentImage, onClickThumbnail, showThumbnails, thumbnailOffset } = this.props;

		if (!showThumbnails) return;

		return (
			<PaginatedThumbnails
				currentImage={currentImage}
				images={images}
				offset={thumbnailOffset}
				onClickThumbnail={onClickThumbnail}
			/>
		);
	}
	render () {
		return (
			<Portal>
				{this.renderDialog()}
			</Portal>
		);
	}
}

Lightbox.propTypes = {
	backdropClosesModal: PropTypes.bool,
	currentImage: PropTypes.number,
	customControls: PropTypes.arrayOf(PropTypes.node),
	enableKeyboardInput: PropTypes.bool,
	imageCountSeparator: PropTypes.string,
	images: PropTypes.arrayOf(
		PropTypes.shape({
			src: PropTypes.string.isRequired,
			srcset: PropTypes.array,
			caption: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
			thumbnail: PropTypes.string,
		})
	).isRequired,
	isOpen: PropTypes.bool,
	onClickImage: PropTypes.func,
	onClickNext: PropTypes.func,
	onClickPrev: PropTypes.func,
	onClose: PropTypes.func.isRequired,
	preloadNextImage: PropTypes.bool,
	sheet: PropTypes.object,
	showCloseButton: PropTypes.bool,
	showImageCount: PropTypes.bool,
	showThumbnails: PropTypes.bool,
	theme: PropTypes.object,
	thumbnailOffset: PropTypes.number,
	width: PropTypes.number,
};
Lightbox.defaultProps = {
	currentImage: 0,
	enableKeyboardInput: true,
	imageCountSeparator: ' of ',
	onClickShowNextImage: true,
	preloadNextImage: true,
	showCloseButton: true,
	showImageCount: true,
	theme: {},
	thumbnailOffset: 2,
	width: 1024,
};
Lightbox.childContextTypes = {
	theme: PropTypes.object.isRequired,
};

const classes = StyleSheet.create({
	content: {
		position: 'relative',
		width: '100%'
	},
	figure: {
		margin: 0, // remove browser default
	},
	imageContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: '100%',
    marginTop: theme.footer.height/2
	},
	image: {
		display: 'block', // removes browser default gutter
		height: 'auto',
		margin: '0 auto', // maintain center on very short screens OR very narrow image
		maxWidth: '100%',

		// disable user select
		WebkitTouchCallout: 'none',
		userSelect: 'none',
	},
});

export default Lightbox;
