import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import theme from '../theme';
import Footer from './Footer';
import Header from './Header';

function renderImage ({ props, image, isVisible }) {
	const {
		images,
		imageCountSeparator,
		index,
		onClickImage,
		showImageCount,
		showThumbnails,
		} = props;

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
			<img
				className={css(classes.image)}
				onClick={!!onClickImage && onClickImage}
				sizes={sizes}
				src={isVisible ? image.src : '#'}
				srcSet={isVisible ? srcset : null}
				style={{
					cursor: onClickImage ? 'pointer' : 'auto',
					maxHeight: `calc(100vh - ${heightOffset})`,
				}}
			/>
			<Footer
				caption={image.caption}
				countCurrent={index + 1}
				countSeparator={imageCountSeparator}
				countTotal={images.length}
				showCount={showImageCount}
			/>
		</figure>
	);
}

const ImageContainer = (props) => {
	const {
		customControls,
		showCloseButton,
		width,
		image,
		isVisible,
		onClose,
		marginBottom,
	} = props;

	const horizontalPadding = theme.container.gutter.horizontal;

	return (
		<div
			className={css(classes.contentContainer)}
			style={{ width: window.innerWidth, paddingLeft: horizontalPadding, paddingRight: horizontalPadding }}
		>
			<div className={css(classes.content)} style={{ marginBottom: marginBottom, maxWidth: width }}>
				<Header
					customControls={customControls}
					onClose={onClose}
					showCloseButton={showCloseButton}
				/>
				{renderImage({ props, image, isVisible })}
			</div>
		</div>
	);
};

const classes = StyleSheet.create({
	contentContainer: {
		display: 'flex',
		justifyContent: 'center',
		alignSelf: 'center',
	},
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

export default ImageContainer;
