'use client'

import { useState, useEffect } from 'react'
import {
	ClipboardCopy,
	FileJson2,
	Send,
	Undo2,
	Clipboard,
	Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import Loading from './Loading'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Json({ games }: { games: any }) {
	const [jsonData, setJsonData] = useState<any>({})
	const [includeCurrent, setIncludeCurrent] = useState(true)
	const [includeUpcoming, setIncludeUpcoming] = useState(false)
	const [webhookUrl, setWebhookUrl] = useState('')
	const [content, setContent] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [embedColor, setEmbedColor] = useState('')
	const [includeFooter, setIncludeFooter] = useState(true)
	const [includePrice, setIncludePrice] = useState(true)
	const [includeImage, setIncludeImage] = useState(true)
	const [allDisabled, setAllDisabled] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const defaultColor = '#85ce4b'
	const defaultContent = '<@&847939354978811924>'

	useEffect(() => {
		const savedIncludeCurrent = localStorage.getItem('includeCurrent')
		const savedIncludeUpcoming = localStorage.getItem('includeUpcoming')
		const savedContent = localStorage.getItem('embedContent')
		const savedColor = localStorage.getItem('embedColor')
		const savedIncludeFooter = localStorage.getItem('includeFooter')
		const savedIncludePrice = localStorage.getItem('includePrice')
		const savedIncludeImage = localStorage.getItem('includeImage')

		if (savedIncludeCurrent !== null)
			setIncludeCurrent(JSON.parse(savedIncludeCurrent))
		if (savedIncludeUpcoming !== null)
			setIncludeUpcoming(JSON.parse(savedIncludeUpcoming))
		if (savedContent) setContent(savedContent)
		if (savedColor) setEmbedColor(savedColor)
		if (savedIncludeFooter !== null)
			setIncludeFooter(JSON.parse(savedIncludeFooter))
		if (savedIncludePrice !== null) setIncludePrice(JSON.parse(savedIncludePrice))
		if (savedIncludeImage !== null) setIncludeImage(JSON.parse(savedIncludeImage))
	}, [])

	useEffect(() => {
		setAllDisabled(!includeCurrent && !includeUpcoming)

		localStorage.setItem('embedContent', content)
		localStorage.setItem('includeCurrent', JSON.stringify(includeCurrent))
		localStorage.setItem('includeUpcoming', JSON.stringify(includeUpcoming))
		localStorage.setItem('includeFooter', JSON.stringify(includeFooter))
		localStorage.setItem('includePrice', JSON.stringify(includePrice))
		localStorage.setItem('includeImage', JSON.stringify(includeImage))
		if (embedColor !== defaultColor) {
			localStorage.setItem('embedColor', embedColor)
		} else {
			localStorage.removeItem('embedColor')
		}
	}, [
		content,
		embedColor,
		includeCurrent,
		includeUpcoming,
		includeFooter,
		includePrice,
		includeImage,
	])

	useEffect(() => {
		const generateJson = () => {
			const selectedGames = [
				...(includeCurrent ? games.currentGames : []),
				...(includeUpcoming ? games.nextGames : []),
			]

			const embeds = selectedGames.map((game: any) => {
				const isCurrent = game.promotions.promotionalOffers.length > 0
				const dateInfo = isCurrent
					? game.promotions.promotionalOffers[0].promotionalOffers[0].endDate
					: game.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
							.startDate
				const endDate = new Date(dateInfo)
				const pageSlug = game.catalogNs?.mappings?.[0]?.pageSlug || game.urlSlug
				const isBundleGame = game.categories?.some(
					(category: any) => category.path === 'bundles'
				)
				const linkPrefix = isBundleGame ? '/bundles/' : '/p/'

				let fieldValue = isCurrent
					? `${
							includePrice
								? `~~${game.price.totalPrice.fmtPrice.originalPrice}~~ **Free**\n`
								: ''
					  }[Claim ${
							isBundleGame ? 'Bundle' : 'Game'
					  }](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`
					: `${
							includePrice ? `${game.price.totalPrice.fmtPrice.originalPrice}\n` : ''
					  }[Game Link](https://store.epicgames.com/en-US${linkPrefix}${pageSlug})`

				const imageUrl = game.keyImages.find(
					(img: any) => img.type === 'OfferImageWide'
				)?.url

				return {
					color: parseInt((embedColor || defaultColor).replace('#', ''), 16),
					fields: [
						{
							name: game.title,
							value: fieldValue,
						},
					],
					author: {
						name: 'Epic Games Store',
						url: 'https://egfreegames.vercel.app/',
						icon_url: 'https://wolfey.s-ul.eu/YcyMXrI1',
					},
					...(includeFooter && {
						footer: {
							text: isCurrent ? 'Offer ends' : 'Offer starts',
						},
						timestamp: endDate.toISOString(),
					}),
					...(includeImage && { image: { url: encodeURI(imageUrl) } }),
				}
			})

			setJsonData({
				content: content || defaultContent,
				embeds: embeds.length > 0 ? embeds : undefined,
			})
		}

		generateJson()
	}, [
		games,
		includeCurrent,
		includeUpcoming,
		content,
		embedColor,
		includeFooter,
		includePrice,
		includeImage,
	])

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 1000)
		} catch (err) {
			console.error('Failed to copy text: ', err)
			toast.error('Failed to copy JSON Data.', {
				position: 'bottom-center',
			})
		}
	}

	const handleWebhook = async () => {
		if (!webhookUrl) {
			toast.error('Insert a webhook.', {
				position: 'bottom-center',
			})
			return
		}

		try {
			setIsLoading(true)
			const response = await fetch('/api/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ webhookUrl, jsonData }),
			})

			if (response.ok) {
				toast.success('Successfully sent embed.', { position: 'bottom-center' })
			} else {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Failed to send JSON Data.')
			}
		} catch (error) {
			console.error('Failed to send:', error, {
				position: 'bottom-center',
			})
			toast.error('Failed to send JSON Data.', {
				description: 'The webhook might be invalid.',
				position: 'bottom-center',
			})
		}
		setIsLoading(false)
	}

	const handleColorChange = (color: string) => {
		setEmbedColor(color === defaultColor ? '' : color)
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText()
			setWebhookUrl(text)
		} catch (err) {
			console.error('Failed to paste text')
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="px-2 rounded-full">
					<FileJson2 />
				</Button>
			</DialogTrigger>
			<DialogContent
				style={{ borderLeft: `6px solid ${embedColor || defaultColor}` }}
				className="bg-white dark:bg-epic-black max-w-3xl max-h-[90vh] flex flex-col"
			>
				<DialogHeader>
					<DialogTitle>JSON Data</DialogTitle>
					<DialogDescription>
						This tool is designed to create Discord embeds. Your preferences are
						stored locally, except your webhook.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="settings" className="flex-grow overflow-hidden">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="preview">JSON Preview</TabsTrigger>
					</TabsList>
					<TabsContent value="settings" className="overflow-y-auto">
						<div className="flex items-center gap-2 mt-2">
							<div className="flex-grow flex">
								<Input
									type={isVisible ? 'text' : 'password'}
									onFocus={() => setIsVisible(true)}
									onBlur={() => setIsVisible(false)}
									placeholder="Webhook URL"
									value={webhookUrl}
									onChange={e => setWebhookUrl(e.target.value)}
									style={{ boxShadow: 'none' }}
									className="rounded-r-none border-r-0"
								/>
								<Button
									variant="outline"
									size="icon"
									className="px-2 rounded-l-none"
									onClick={handlePaste}
								>
									<Clipboard className="size-4" />
								</Button>
							</div>
							<Button onClick={handleWebhook} disabled={isLoading}>
								{isLoading ? (
									<div className="sm:mr-2 mt-0.5">
										<Loading size={16} color={embedColor || defaultColor} />
									</div>
								) : (
									<Send className="size-4 sm:mr-2" />
								)}
								<p className="sm:block hidden">Send</p>
							</Button>
						</div>
						<Card className="mt-4">
							<CardContent className="space-y-4 mt-6">
								<div className="flex items-center gap-2">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												className="size-10"
												style={{ backgroundColor: embedColor || defaultColor }}
											/>
										</PopoverTrigger>
										<PopoverContent
											className="w-full p-3"
											align="start"
											onOpenAutoFocus={(e: any) => e.preventDefault()}
										>
											<Input
												maxLength={7}
												value={embedColor || defaultColor}
												onChange={e => handleColorChange(e.target.value)}
												className="mb-2"
											/>
											<HexColorPicker
												color={embedColor || defaultColor}
												onChange={handleColorChange}
												className="!w-full mb-2"
											/>
											<Button
												onClick={() => setEmbedColor(defaultColor)}
												variant="outline"
												size="sm"
												className="w-full"
											>
												<Undo2 className="size-4 mr-2" />
												Reset to Default
											</Button>
										</PopoverContent>
									</Popover>
									<div className="flex-grow">
										<Input
											placeholder={defaultContent}
											value={content}
											onChange={e => setContent(e.target.value)}
										/>
									</div>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">Game Selection</Label>
										<div className="flex items-center gap-2">
											<Switch
												id="current-games"
												checked={includeCurrent}
												onCheckedChange={(checked: boolean) => setIncludeCurrent(checked)}
											/>
											<Label htmlFor="current-games">Current</Label>
										</div>
										<div className="flex items-center gap-2">
											<Switch
												id="upcoming-games"
												checked={includeUpcoming}
												onCheckedChange={(checked: boolean) => setIncludeUpcoming(checked)}
											/>
											<Label htmlFor="upcoming-games">Upcoming</Label>
										</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Embed Options</Label>
										<div className="flex items-center gap-2">
											<Switch
												id="include-price"
												checked={includePrice}
												onCheckedChange={(checked: boolean) => setIncludePrice(checked)}
												disabled={allDisabled}
											/>
											<Label htmlFor="include-price">Price</Label>
										</div>
										<div className="flex items-center gap-2">
											<Switch
												id="include-image"
												checked={includeImage}
												onCheckedChange={(checked: boolean) => setIncludeImage(checked)}
												disabled={allDisabled}
											/>
											<Label htmlFor="include-image">Image</Label>
										</div>
										<div className="flex items-center gap-2">
											<Switch
												id="include-footer"
												checked={includeFooter}
												onCheckedChange={(checked: boolean) => setIncludeFooter(checked)}
												disabled={allDisabled}
											/>
											<Label htmlFor="include-footer">Footer</Label>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="preview" className="overflow-y-auto pt-3">
						<Card>
							<CardContent className="p-4">
								<Button
									onClick={copyToClipboard}
									variant="outline"
									size="sm"
									className="mb-4 w-full"
								>
									{isCopied ? (
										<Check className="size-4 mr-2" />
									) : (
										<ClipboardCopy className="size-4 mr-2" />
									)}
									Copy JSON
								</Button>
								<ScrollArea className="w-full rounded-md">
									<pre className="max-h-[50vh] bg-secondary text-secondary-foreground p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap break-all">
										{JSON.stringify(jsonData, null, 2)}
									</pre>
								</ScrollArea>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
