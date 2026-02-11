/**
 * @fileoverview Instructions for installing TaskRankr as a PWA
 */

import {
  AppWindow,
  Download,
  Globe,
  MonitorSmartphone,
  Share,
  Smartphone,
  SquarePlus,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { BackButtonHeader } from '@/components/BackButton'
import { Card, CardContent } from '@/components/primitives/Card'
import { CollapsibleCard } from '@/components/primitives/CollapsibleCard'
import { ScrollablePage } from '@/components/primitives/ScrollablePage'
import { IconSize } from '@/lib/constants'
import { cn } from '@/lib/utils'

type DeviceType = 'ios' | 'android' | 'desktop'

function detectDevice(): DeviceType {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

const StepCard = ({
  stepNumber,
  title,
  description,
  testId,
}: {
  stepNumber: number
  title: string
  description: React.ReactNode
  testId: string
}) => (
  <Card className="bg-card/50 border-white/10" data-testid={testId}>
    <CardContent className="p-4 flex items-start gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
        {stepNumber}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
)

const BenefitCard = ({
  icon,
  title,
  description,
  testId,
}: {
  icon: React.ReactNode
  title: string
  description: string
  testId: string
}) => (
  <Card className="bg-card/50 border-white/10" data-testid={testId}>
    <CardContent className="p-4 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
)

const DeviceSectionTitle = ({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) => (
  <span className="flex items-center gap-2 text-lg font-semibold text-primary">
    {icon}
    {label}
  </span>
)

const HowToInstall = () => {
  const device = detectDevice()

  return (
    <ScrollablePage className="pb-16">
      <BackButtonHeader title="How To Install" />

      <div className="space-y-6">
        <section data-testid="section-benefits">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Why Install?
          </h2>
          <div className="space-y-3">
            <BenefitCard
              icon={<MonitorSmartphone className={IconSize.HW5} />}
              title="Home Screen Icon"
              description="Get quick access to TaskRankr right from your home screen, just like a native app."
              testId="card-benefit-icon"
            />
            <BenefitCard
              icon={<AppWindow className={IconSize.HW5} />}
              title="Full Screen Experience"
              description="The browser address bar, navigation buttons, and other browser elements are hidden, giving you a clean, distraction-free interface."
              testId="card-benefit-fullscreen"
            />
            <BenefitCard
              icon={<WifiOff className={IconSize.HW5} />}
              title="Offline Access"
              description="Use TaskRankr even without an internet connection. Your tasks are stored locally and sync when you're back online."
              testId="card-benefit-offline"
            />
            <BenefitCard
              icon={<Wifi className={IconSize.HW5} />}
              title="Fast Loading"
              description="Installed apps load faster since resources are cached on your device, providing a snappier experience."
              testId="card-benefit-fast"
            />
          </div>
        </section>

        <CollapsibleCard
          defaultOpen={device === 'ios'}
          noCard
          title={
            <DeviceSectionTitle
              icon={<Smartphone className={cn(IconSize.HW5, 'text-primary')} />}
              label="iPhone / iPad (Safari)"
            />
          }
          data-testid="section-iphone"
        >
          <div className="space-y-3">
            <StepCard
              stepNumber={1}
              title="Open in Safari"
              description="Make sure you're viewing TaskRankr in Safari. This won't work from other browsers on iOS."
              testId="card-ios-step-1"
            />
            <StepCard
              stepNumber={2}
              title="Tap the Share button"
              description={
                <>
                  Tap the{' '}
                  <Share className="inline h-4 w-4 align-text-bottom text-primary" />{' '}
                  Share button at the bottom of the screen (the square with an
                  arrow pointing up).
                </>
              }
              testId="card-ios-step-2"
            />
            <StepCard
              stepNumber={3}
              title="Tap 'Add to Home Screen'"
              description={
                <>
                  Scroll down in the share menu and tap{' '}
                  <SquarePlus className="inline h-4 w-4 align-text-bottom text-primary" />{' '}
                  <strong>Add to Home Screen</strong>.
                </>
              }
              testId="card-ios-step-3"
            />
            <StepCard
              stepNumber={4}
              title="Confirm"
              description="You can rename the app if you'd like, then tap Add in the top-right corner. TaskRankr will appear on your home screen."
              testId="card-ios-step-4"
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          defaultOpen={device === 'android'}
          noCard
          title={
            <DeviceSectionTitle
              icon={<Smartphone className={cn(IconSize.HW5, 'text-primary')} />}
              label="Android (Chrome)"
            />
          }
          data-testid="section-android"
        >
          <div className="space-y-3">
            <StepCard
              stepNumber={1}
              title="Open in Chrome"
              description="Make sure you're viewing TaskRankr in Google Chrome for the best experience."
              testId="card-android-step-1"
            />
            <StepCard
              stepNumber={2}
              title="Tap the menu"
              description="Tap the three-dot menu in the top-right corner of Chrome."
              testId="card-android-step-2"
            />
            <StepCard
              stepNumber={3}
              title="Tap 'Install app' or 'Add to Home screen'"
              description={
                <>
                  Look for{' '}
                  <Download className="inline h-4 w-4 align-text-bottom text-primary" />{' '}
                  <strong>Install app</strong> or{' '}
                  <strong>Add to Home screen</strong> in the menu. The option name
                  varies by device and Chrome version.
                </>
              }
              testId="card-android-step-3"
            />
            <StepCard
              stepNumber={4}
              title="Confirm"
              description="Tap Install or Add to confirm. TaskRankr will appear on your home screen and in your app drawer."
              testId="card-android-step-4"
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          defaultOpen={device === 'desktop'}
          noCard
          title={
            <DeviceSectionTitle
              icon={<Globe className={cn(IconSize.HW5, 'text-primary')} />}
              label="Desktop (Chrome / Edge)"
            />
          }
          data-testid="section-desktop"
        >
          <div className="space-y-3">
            <StepCard
              stepNumber={1}
              title="Look for the install icon"
              description={
                <>
                  In the address bar, look for a{' '}
                  <Download className="inline h-4 w-4 align-text-bottom text-primary" />{' '}
                  install icon or a prompt near the right side. You can also click
                  the three-dot menu and select <strong>Install TaskRankr</strong>
                  .
                </>
              }
              testId="card-desktop-step-1"
            />
            <StepCard
              stepNumber={2}
              title="Confirm installation"
              description="Click Install in the confirmation dialog. TaskRankr will open in its own window without browser chrome."
              testId="card-desktop-step-2"
            />
          </div>
        </CollapsibleCard>
      </div>
    </ScrollablePage>
  )
}

export default HowToInstall
