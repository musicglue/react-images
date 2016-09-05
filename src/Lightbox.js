import React, { Component, PropTypes } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
 import Swipeable from 'react-swipeable';

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
		if (this._isLastImage()) return;
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.props.onClickNext();
		this._resetSwipe();

	}
	gotoPrev (event) {
		if (this._isFirstImage()) return;
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.props.onClickPrev();
		this._resetSwipe();

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
		if (this._isLastImage()) return;
		this.setState({
			isSwipingLeft: true,
			isSwipingRight: false,
			swipeDeltaX: deltaX
		})
	}
	onSwipingRight (e, deltaX) {
		if (this._isFirstImage()) return;
		this.setState({
			isSwipingLeft: false,
			isSwipingRight: true,
			swipeDeltaX: deltaX
		})
	}
	_isFirstImage() {
		return this.props.currentImage === 0;
	}
	_isLastImage () {
		return this.props.currentImage === (this.props.images.length - 1);
	}
	_resetSwipe() {
		this.setState({
			isSwipingLeft: false,
			isSwipingRight: false,
			swipeDeltaX: 0
		})
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

		const imageLeft = this.state.isSwipingRight ? images[currentImage - 1] : null;
		const imageRight = this.state.isSwipingLeft ? images[currentImage + 1] : null;
		const deltaX = this.state.isSwipingRight ? this.state.swipeDeltaX : this.state.isSwipingLeft ? -this.state.swipeDeltaX : 0;

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
					onSwipedLeft={this.gotoNext}
					onSwipedRight={this.gotoPrev}
					onSwipingLeft={this.onSwipingLeft}
					onSwipingRight={this.onSwipingRight}
				>

					{
						imageLeft ?
							<img
								className={css(classes.image)}
								sizes={sizes}
								src={imageLeft.src}
								style={{
									cursor: this.props.onClickImage ? 'pointer' : 'auto',
									//maxHeight: `calc(100vh - ${heightOffset})`,
									marginLeft: `calc(-100vw + ${deltaX}px)`,
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)'
								}}
							/>
							:
							null
					}
					<img
						className={css(classes.image)}
						onClick={!!onClickImage && onClickImage}
						sizes={sizes}
						src={image.src}
						srcSet={srcset}
						style={{
							cursor: this.props.onClickImage ? 'pointer' : 'auto',
							//maxHeight: `calc(100vh - ${heightOffset})`,
							marginLeft: deltaX,
						}}
					/>
					{
						imageRight ?
							<img
								className={css(classes.image)}
								sizes={sizes}
								src={imageRight.src}
								style={{
									cursor: this.props.onClickImage ? 'pointer' : 'auto',
									//maxHeight: `calc(100vh - ${heightOffset})`,
									marginLeft: `calc(100vw + ${deltaX}px)`,
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)'
								}}
							/>
							:
							null
					}
					<Footer
						caption={images[currentImage].caption}
						countCurrent={currentImage + 1}
						countSeparator={imageCountSeparator}
						countTotal={images.length}
						showCount={showImageCount}
					/>
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
	},
	figure: {
		margin: 0, // remove browser default
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
